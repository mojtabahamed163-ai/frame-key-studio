import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Download,
  FileDown, FileText, Film, FolderOpen, HardDrive, Languages, LoaderCircle,
  Package, Plus, ScanFace, Scissors, ShieldCheck, Sparkles, Upload, X,
} from "lucide-react";
import { BrandControls } from "@/features/studio/components/BrandControls";
import { CaptionCueEditor } from "@/features/studio/components/CaptionCueEditor";
import { StudioHeader } from "@/features/studio/components/StudioHeader";
import { VideoPreview } from "@/features/studio/components/VideoPreview";
import { applyCaptionCuePatch, translatedCuesForLanguage } from "@/features/studio/analysis/caption-edits";
import { buildCaptionCues, buildClipSpeechRanges, EXPORT_FRAME_RATE, joinTranscriptWords, mapCaptionCuesToOutput, suggestClips, toWordCues, WORD_CUE_PREFIX } from "@/features/studio/analysis/clip-analysis";
import { createSerializedAsyncQueue, isCurrentFaceTrack, isCurrentProjectSnapshot, isCurrentSourceOperation, isCurrentTranslation, isOperationOwner, markSourceSavedIfMatchingProject, matchesReselectedSource, recoveryProjectAfterOpenFailure, shouldClearPendingProject } from "@/features/studio/async-guards";
import { exportSrt, exportVtt, parseSubtitleFile } from "@/features/studio/analysis/subtitles";
import { createZip, downloadBlob, downloadText, safeFileStem, uniqueFilename } from "@/features/studio/export/download";
import { inspectVideo, MAX_SOURCE_DIMENSION_PX, MAX_SOURCE_DURATION_SECONDS, MAX_SOURCE_FILE_BYTES, transcribeVideo, type AnalysisProgress } from "@/features/studio/media/analyze-video";
import { summarizeFaceTrack, trackLargestFace, type FaceKeyframe, type FaceTrackingProgress } from "@/features/studio/media/face-tracking";
import { portraitCropQuality } from "@/features/studio/media/framing";
import { translateCues, type TranslationProgress } from "@/features/studio/models/translate-cues";
import { createProject, deleteProject, listProjects, loadSettings, loadSourceFromOpfs, saveProject, saveSettings, saveSourceToOpfs } from "@/features/studio/storage/project-store";
import { DEFAULT_SETTINGS, type CaptionCue, type ClipSuggestion, type StepId, type StudioProject, type StudioSettings, type TranscriptionWarningCode, type VideoMetadata } from "@/features/studio/types";
import type { ExportProgress, ExportResult, FileWritable, OutputFormat } from "@/features/studio/export/convert-clip";
import "@/features/studio/studio.css";

const LANGUAGE_OPTIONS = [
  ["auto", "Auto-detect"], ["en", "English"], ["es", "Spanish"], ["fr", "French"], ["de", "German"],
  ["it", "Italian"], ["pt", "Portuguese"], ["ar", "Arabic"], ["nl", "Dutch"], ["ja", "Japanese"], ["zh", "Chinese"],
] as const;
const ZIP_LIMIT = 64 * 1024 * 1024;
const LARGE_FILE_WARNING_BYTES = 750 * 1024 * 1024;

interface SavedOutput { result: ExportResult; clipId: string; clipLabel: string }
type ClipRenderStatus = "queued" | "rendering" | "ready" | "failed" | "cancelled";
type RetryAction = "analysis" | "translation" | "face" | "export-one" | "export-batch";

function formatTime(seconds: number): string {
  const value = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = Math.floor(value % 60).toString().padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}` : `${minutes}:${secs}`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function renderStatusLabel(status: ClipRenderStatus | undefined, hasOutput: boolean): string {
  if (!status) return hasOutput ? "Ready" : "Not started";
  return { queued: "Queued", rendering: "Rendering", ready: "Ready", failed: "Failed", cancelled: "Cancelled" }[status];
}

function prettyDate(timestamp: number): string {
  try { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(timestamp); }
  catch { return "Saved locally"; }
}

function sourceCues(project: StudioProject): CaptionCue[] {
  return project.editedCues.length ? project.editedCues : buildCaptionCues(project.words);
}

function transcriptionWarningText(codes: TranscriptionWarningCode[]): string {
  const messages: string[] = [];
  if (codes.includes("timestamp-outside-source-tail")) messages.push("Whisper returned word timestamps outside the final audio window; small boundary drift may be clipped while larger overruns are excluded. Review the last captions.");
  else if (codes.includes("timestamp-outside-audio-window")) messages.push("Whisper returned word timestamps outside an audio window; small boundary drift may be clipped while larger overruns are excluded. Review nearby captions.");
  if (codes.includes("suspicious-word-duration")) messages.push("Whisper returned a word with an implausibly long timestamp; it was excluded, so review the nearby transcript.");
  if (codes.includes("audio-activity-after-last-word")) messages.push("Sustained audio activity continues after the last accepted word. Listen to the final seconds for a missing phrase.");
  if (codes.includes("inferred-word-end")) messages.push("A final word arrived without an end timestamp; its end was bounded by the next word or the audio window. Review the last caption.");
  if (codes.includes("conflicting-overlap-words")) messages.push("Overlapping audio windows disagreed on words; review the transcript around those boundaries.");
  return messages.join(" ");
}

function needsSourceTailReview(codes: TranscriptionWarningCode[]): boolean {
  return codes.includes("timestamp-outside-source-tail") || codes.includes("audio-activity-after-last-word");
}

function estimateOutputBytes(clips: ClipSuggestion[], settings: StudioSettings): number {
  const videoBitrate = settings.outputHeight === 1920 ? 12_000_000 : 6_000_000;
  const bitrate = videoBitrate + 128_000;
  return clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start) * bitrate / 8 + 2_500_000, 0);
}

function clipTitle(clip: ClipSuggestion, index: number): string {
  return clip.selectedTitle?.trim() || clip.titleOptions[0]?.trim() || `Clip ${index + 1}`;
}

function getPickerWindow(): Window & { showSaveFilePicker?: unknown } {
  return window as Window & { showSaveFilePicker?: unknown };
}

export default function Studio() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const analysisController = useRef<AbortController | null>(null);
  const faceController = useRef<AbortController | null>(null);
  const exportController = useRef<AbortController | null>(null);
  const translationController = useRef<AbortController | null>(null);
  const sourceGeneration = useRef(0);
  const projectRevision = useRef(0);
  const projectWriteQueue = useMemo(() => createSerializedAsyncQueue(), []);
  const activeProjectIdRef = useRef<string | null>(null);
  const [project, setProject] = useState<StudioProject | null>(null);
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const targetLanguageRef = useRef(settings.targetLanguage);
  const [step, setStep] = useState<StepId>("upload");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [savedProjects, setSavedProjects] = useState<StudioProject[]>([]);
  const [pendingProject, setPendingProject] = useState<StudioProject | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTrackingFace, setIsTrackingFace] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingSource, setIsSavingSource] = useState(false);
  const [isProjectTransitioning, setIsProjectTransitioning] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null);
  const [faceProgress, setFaceProgress] = useState<FaceTrackingProgress | null>(null);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat | null>(null);
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [renderStatuses, setRenderStatuses] = useState<Record<string, ClipRenderStatus>>({});
  const [clipProgress, setClipProgress] = useState<Record<string, number>>({});
  const [renderErrors, setRenderErrors] = useState<Record<string, string>>({});
  const [outputs, setOutputs] = useState<SavedOutput[]>([]);
  const [batchZip, setBatchZip] = useState<Blob | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [saveState, setSaveState] = useState<"loading" | "saved" | "saving" | "error">("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryAction, setRetryAction] = useState<RetryAction | null>(null);
  const [localStorageReady, setLocalStorageReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  activeProjectIdRef.current = project?.id ?? null;
  const activeClip = useMemo(() => project?.clips.find((clip) => clip.id === project.selectedClipId) ?? null, [project]);
  const faceKeyframes = useMemo(() => activeClip && project ? project.faceKeyframesByClip[activeClip.id] ?? [] : [], [activeClip, project]);
  const faceTrackSummary = useMemo(() => activeClip
    ? summarizeFaceTrack(faceKeyframes, activeClip.end - activeClip.start)
    : null, [activeClip, faceKeyframes]);
  const currentCues = useMemo(() => {
    if (!project) return [];
    const translatedCues = translatedCuesForLanguage(project.translatedCues, settings.targetLanguage);
    const translatedForClip = activeClip ? translatedCues.some((cue) => cue.end >= activeClip.start && cue.start <= activeClip.end) : translatedCues.length > 0;
    const cues = settings.targetLanguage !== "none" && project.translatedLanguage === settings.targetLanguage && translatedForClip
      ? translatedCues
      : sourceCues(project);
    return settings.captionMode === "word" ? toWordCues(cues) : cues;
  }, [project, settings.targetLanguage, settings.captionMode, activeClip]);
  const currentClipCues = useMemo(() => activeClip ? currentCues.filter((cue) => cue.end >= activeClip.start && cue.start <= activeClip.end) : currentCues, [activeClip, currentCues]);
  const estimatedZipBytes = project ? estimateOutputBytes(project.clips.filter((clip) => selectedForBatch.includes(clip.id)), settings) : 0;
  const portraitQuality = project ? portraitCropQuality(project.width, project.height, settings.outputHeight) : null;
  const hasSavePicker = typeof getPickerWindow().showSaveFilePicker === "function";
  const isBusy = isAnalyzing || isTranslating || isTrackingFace || isExporting || isSavingSource || isProjectTransitioning;
  const isCurrentSnapshot = useCallback((projectId: string, revision: number) => isCurrentProjectSnapshot(
    { projectId, projectRevision: revision },
    { projectId: activeProjectIdRef.current ?? "", projectRevision: projectRevision.current },
  ), []);
  const queueProjectSnapshotSave = useCallback((snapshot: StudioProject, revision: number, force = false): Promise<boolean> => projectWriteQueue(async () => {
    if (!force && !isCurrentSnapshot(snapshot.id, revision)) return false;
    await saveProject(snapshot);
    if (!isCurrentSnapshot(snapshot.id, revision)) return false;
    const projects = await listProjects();
    if (!isCurrentSnapshot(snapshot.id, revision)) return false;
    setSavedProjects(projects);
    setSaveState("saved");
    return true;
  }), [projectWriteQueue, isCurrentSnapshot]);

  useEffect(() => {
    document.title = "Local Video Studio — Frame & Key";
    let alive = true;
    Promise.all([loadSettings(), listProjects()]).then(([loadedSettings, projects]) => {
      if (!alive) return;
      setSettings(loadedSettings);
      targetLanguageRef.current = loadedSettings.targetLanguage;
      setSavedProjects(projects);
      setLocalStorageReady(true);
      setSaveState("saved");
    }).catch(() => {
      if (!alive) return;
      setLocalStorageReady(true);
      setSaveState("error");
      setError("Local project storage is unavailable in this browser. You can still edit and export while this page stays open.");
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!project || !localStorageReady) return;
    const revision = projectRevision.current;
    const projectId = project.id;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      void queueProjectSnapshotSave(project, revision).catch(() => {
        if (!isCurrentSnapshot(projectId, revision)) return;
        setSaveState("error");
        setError("Local save failed. Keep this tab open and make another edit to retry saving your project.");
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [project, localStorageReady, isCurrentSnapshot, queueProjectSnapshotSave]);

  useEffect(() => {
    if (!localStorageReady) return;
    const timer = window.setTimeout(() => { void saveSettings(settings).catch(() => { setSaveState("error"); setError("Local settings save failed. Your current settings remain active in this tab."); }); }, 250);
    return () => window.clearTimeout(timer);
  }, [settings, localStorageReady]);

  useEffect(() => {
    if (!sourceFile) { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(sourceFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  useEffect(() => {
    let alive = true;
    void import("@/features/studio/export/convert-clip")
      .then(({ supportedOutputFormat }) => supportedOutputFormat(settings.outputHeight, metadata?.hasAudio ?? true))
      .then((format) => { if (alive) setOutputFormat(format); })
      .catch(() => { if (alive) setOutputFormat(null); });
    return () => { alive = false; };
  }, [settings.outputHeight, metadata?.hasAudio]);

  useEffect(() => () => {
    analysisController.current?.abort();
    faceController.current?.abort();
    exportController.current?.abort();
    translationController.current?.abort();
  }, []);

  useEffect(() => {
    if (saveState !== "saving") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  function commitProject(next: StudioProject) {
    projectRevision.current += 1;
    activeProjectIdRef.current = next.id;
    setProject({ ...next, updatedAt: Date.now() });
  }

  function invalidateClipOutputs(clipIds?: string[]) {
    if (clipIds && clipIds.length === 0) return;
    const affected = clipIds ? new Set(clipIds) : null;
    setOutputs((current) => affected ? current.filter((item) => !affected.has(item.clipId)) : []);
    setBatchZip(null);
    setRenderStatuses((current) => affected
      ? Object.fromEntries(Object.entries(current).filter(([id]) => !affected.has(id)))
      : {});
    setClipProgress((current) => affected ? Object.fromEntries(Object.entries(current).filter(([id]) => !affected.has(id))) : {});
    setRenderErrors((current) => affected ? Object.fromEntries(Object.entries(current).filter(([id]) => !affected.has(id))) : {});
  }

  function changeSettings(patch: Partial<StudioSettings>) {
    const targetLanguageChanged = patch.targetLanguage !== undefined && patch.targetLanguage !== settings.targetLanguage;
    const next = { ...settings, ...patch };
    targetLanguageRef.current = next.targetLanguage;
    if (targetLanguageChanged) translationController.current?.abort();
    invalidateClipOutputs();
    setSettings(next);
    if (project) commitProject(targetLanguageChanged
      ? { ...project, settings: next, translatedCues: [], translatedLanguage: "none" }
      : { ...project, settings: next });
  }

  function goToStep(next: StepId) {
    if (isBusy) return;
    setStep(next);
    if (project) commitProject({ ...project, step: next });
    setError("");
  }

  async function activateSavedProject(saved: StudioProject, file: File, generation: number, expectedRevision: number) {
    setError("");
    try {
      const info = await inspectVideo(file);
      if (sourceGeneration.current !== generation) return;
      if (projectRevision.current !== expectedRevision) {
        setError("The active project changed while the source was being checked. It was not replaced; reopen the saved project after the current edit settles.");
        return;
      }
      if (saved.duration > 0 && (Math.abs(info.duration - saved.duration) > 0.5 || info.width !== saved.width || info.height !== saved.height)) {
        throw new Error("This video does not match the saved source metadata. Keep the project and choose the original recording.");
      }
      const merged: StudioProject = {
        ...saved,
        settings: { ...DEFAULT_SETTINGS, ...saved.settings },
        editedCues: saved.editedCues ?? [],
        translatedCues: saved.translatedCues ?? [],
        faceKeyframesByClip: saved.faceKeyframesByClip ?? {},
      };
      setSourceFile(file);
      setMetadata(info);
      activeProjectIdRef.current = merged.id;
      setProject(merged);
      setSettings(merged.settings);
      targetLanguageRef.current = merged.settings.targetLanguage;
      setStep(merged.step);
      setCurrentTime(merged.selectedClipId ? merged.clips.find((item) => item.id === merged.selectedClipId)?.start ?? 0 : 0);
      setSelectedForBatch(merged.clips.map((clip) => clip.id));
      invalidateClipOutputs();
      setPendingProject(null);
    } catch (cause) {
      if (sourceGeneration.current !== generation) return;
      if (projectRevision.current !== expectedRevision) return;
      const recoveryProject = recoveryProjectAfterOpenFailure(saved);
      if (recoveryProject) setPendingProject(recoveryProject);
      setError(cause instanceof Error ? cause.message : "Could not reopen this source file.");
    }
  }

  async function acceptFile(file: File) {
    if (isBusy) { setError("Finish or cancel the current operation before choosing another source."); return; }
    const currentProject = project;
    const startingRevision = projectRevision.current;
    setIsProjectTransitioning(true);
    try {
      if (currentProject) {
        await queueProjectSnapshotSave(currentProject, startingRevision, true);
        if (!isCurrentSnapshot(currentProject.id, startingRevision)) {
          setError("The active project changed while its local save was finishing. It was left untouched; choose the source again after the save settles.");
          return;
        }
      }
      sourceGeneration.current += 1;
      projectRevision.current += 1;
      const generation = sourceGeneration.current;
      const revision = projectRevision.current;
      analysisController.current?.abort();
      faceController.current?.abort();
      translationController.current?.abort();
      setError("");
      setNotice("");
      if (pendingProject) {
        if (!matchesReselectedSource(pendingProject, file)) {
          setError("This file does not match the saved source identity (name, size, or last modified time). Keep the project, then choose its original source file.");
          return;
        }
        await activateSavedProject(pendingProject, file, generation, revision);
        return;
      }
      const info = await inspectVideo(file);
      if (sourceGeneration.current !== generation) return;
      if (projectRevision.current !== revision) {
        setError("The active project changed while this video was being checked. It was not replaced; choose the video again after the current edit settles.");
        return;
      }
      const prefs = await loadSettings().catch(() => settings);
      if (sourceGeneration.current !== generation) return;
      if (projectRevision.current !== revision) {
        setError("The active project changed while settings were loading. It was not replaced; choose the video again after the current edit settles.");
        return;
      }
      const projectSettings = { ...prefs, smartFraming: false };
      const next = createProject(file, projectSettings);
      next.duration = info.duration;
      next.width = info.width;
      next.height = info.height;
      next.step = "upload";
      setSourceFile(file);
      setMetadata(info);
      setSettings(projectSettings);
      targetLanguageRef.current = projectSettings.targetLanguage;
      activeProjectIdRef.current = next.id;
      setProject(next);
      setStep("upload");
      setCurrentTime(0);
      setOutputs([]);
      setBatchZip(null);
      setRenderStatuses({});
      setClipProgress({});
      setRenderErrors({});
      setSelectedForBatch([]);
      setNotice(file.size >= LARGE_FILE_WARNING_BYTES
        ? "Video selected locally. This larger file may use substantial memory during analysis or export; close other heavy tabs and consider saving the source locally."
        : "Video selected. It has not been uploaded to the website.");
      void queueProjectSnapshotSave(next, revision).catch(() => {
        if (isCurrentSnapshot(next.id, revision)) setSaveState("error");
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The browser could not read this video format.");
    } finally {
      setIsProjectTransitioning(false);
    }
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (file) void acceptFile(file);
  }

  async function removeSource() {
    if (isBusy) {
      setError("Finish or cancel the current operation before removing the source.");
      return;
    }
    const currentProject = project;
    const revision = projectRevision.current;
    setIsProjectTransitioning(true);
    setError("");
    try {
      if (currentProject) {
        const saved = await queueProjectSnapshotSave(currentProject, revision, true);
        if (!saved) throw new Error("The current project could not be saved before the source was removed.");
      }
      sourceGeneration.current += 1;
      projectRevision.current += 1;
      analysisController.current?.abort();
      faceController.current?.abort();
      translationController.current?.abort();
      exportController.current?.abort();
      invalidateClipOutputs();
      activeProjectIdRef.current = null;
      setProject(null);
      setSourceFile(null);
      setMetadata(null);
      setPendingProject(null);
      setStep("upload");
      setCurrentTime(0);
      setSelectedForBatch([]);
      setRenderStatuses({});
      setClipProgress({});
      setRenderErrors({});
      setNotice(currentProject ? "Source removed from this tab. The saved project remains available in this browser." : "Source removed. Choose another local video when you are ready.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The source was not removed because the project could not be saved.");
    } finally {
      setIsProjectTransitioning(false);
    }
  }

  async function openSavedProject(saved: StudioProject) {
    if (isBusy) { setError("Finish or cancel the current operation before opening a saved project."); return; }
    const currentProject = project;
    const startingRevision = projectRevision.current;
    setIsProjectTransitioning(true);
    setError("");
    try {
      if (currentProject) await queueProjectSnapshotSave(currentProject, startingRevision, true);
      if (!isCurrentSnapshot(currentProject?.id ?? "", startingRevision)) {
        setError("The active project changed while its local save was finishing. It was left untouched; reopen the saved project after the save settles.");
        return;
      }
      sourceGeneration.current += 1;
      projectRevision.current += 1;
      const generation = sourceGeneration.current;
      const revision = projectRevision.current;
      const projectToOpen = currentProject?.id === saved.id ? currentProject : saved;
      analysisController.current?.abort();
      faceController.current?.abort();
      translationController.current?.abort();
      const localFile = projectToOpen.sourceSavedInOpfs ? await loadSourceFromOpfs(projectToOpen.id) : null;
      if (sourceGeneration.current !== generation || projectRevision.current !== revision) return;
      if (localFile) {
        await activateSavedProject(projectToOpen, localFile, generation, revision);
        return;
      }
      setPendingProject(projectToOpen);
      setNotice(`Choose the original source file for “${projectToOpen.name}” to continue editing. The saved transcript and settings remain on this device.`);
    } catch (cause) {
      setError(cause instanceof Error ? `Could not finish the current local save: ${cause.message}` : "Could not finish the current local save.");
    } finally {
      setIsProjectTransitioning(false);
    }
  }

  async function removeSavedProject(saved: StudioProject) {
    if (isBusy) return;
    if (!window.confirm(`Delete the local project “${saved.name}” from this browser?`)) return;
    const removesCurrentProject = project?.id === saved.id;
    setIsProjectTransitioning(true);
    if (removesCurrentProject) projectRevision.current += 1;
    try {
      await projectWriteQueue(() => deleteProject(saved));
      sourceGeneration.current += 1;
      analysisController.current?.abort();
      faceController.current?.abort();
      translationController.current?.abort();
      setSavedProjects(await listProjects());
      if (shouldClearPendingProject(pendingProject, saved)) setPendingProject(null);
      if (project?.id === saved.id) {
        projectRevision.current += 1;
        invalidateClipOutputs();
        activeProjectIdRef.current = null;
        setProject(null); setSourceFile(null); setMetadata(null); setStep("upload"); setSelectedForBatch([]); setRenderStatuses({});
      }
    } catch (cause) {
      setError(cause instanceof Error ? `Could not delete the saved project: ${cause.message}` : "Could not delete the saved project. Try again.");
      if (removesCurrentProject && project?.id === saved.id) commitProject(project);
    } finally {
      setIsProjectTransitioning(false);
    }
  }

  async function saveSourceLocally() {
    if (!project || !sourceFile || isSavingSource) return;
    const projectId = project.id;
    const generation = sourceGeneration.current;
    const source = sourceFile;
    setError("");
    setIsSavingSource(true);
    setNotice("Saving the original source in this browser’s private local storage…");
    try {
      const saved = await saveSourceToOpfs(projectId, source);
      if (sourceGeneration.current !== generation) return;
      if (!saved) {
        setError("This browser could not store the source file locally. Project notes still auto-save; keep the original video file to reopen it.");
        return;
      }
      projectRevision.current += 1;
      setProject((current) => {
        const updated = markSourceSavedIfMatchingProject(current, projectId);
        return updated ? { ...updated, updatedAt: Date.now() } : updated;
      });
      setNotice("Source video saved on this device. It was not uploaded.");
    } catch (cause) {
      if (sourceGeneration.current === generation) {
        setError(cause instanceof Error ? `The source could not be saved locally: ${cause.message}` : "The source could not be saved locally. Keep the original video file to reopen it.");
      }
    } finally {
      setIsSavingSource(false);
    }
  }

  async function runTranscription() {
    if (!sourceFile || !project) return;
    if (isBusy) { setError("Finish or cancel the current operation before starting speech analysis."); return; }
    setError("");
    setNotice("");
    setRetryAction(null);
    setIsAnalyzing(true);
    setAnalysisProgress({ stage: "metadata", progress: 0, detail: "Starting local analysis" });
    const controller = new AbortController();
    analysisController.current = controller;
    const generation = sourceGeneration.current;
    const revision = projectRevision.current;
    const projectId = project.id;
    const analyzedFile = sourceFile;
    const identity = { sourceGeneration: generation, projectRevision: revision, projectId, sourceFile: analyzedFile };
    const isCurrent = () => isOperationOwner(controller, analysisController.current) && isCurrentSourceOperation(identity, {
      sourceGeneration: sourceGeneration.current,
      projectRevision: projectRevision.current,
      projectId: project.id,
      sourceFile,
    });
    const reportProgress = (progress: AnalysisProgress) => { if (isCurrent()) setAnalysisProgress(progress); };
    try {
      const transcription = await transcribeVideo(sourceFile, project.sourceLanguage, controller.signal, reportProgress);
      if (!isCurrent()) return;
      const words = transcription.words;
      if (!words.length) throw new Error("No timed speech words were returned. Import an SRT/VTT file or add clips manually.");
      const suggestions = suggestClips(words, 3, project.duration);
      const next: StudioProject = {
        ...project,
        words,
        transcriptionWarnings: transcription.warnings,
        editedCues: buildCaptionCues(words),
        translatedCues: [],
        translatedLanguage: "none",
        clips: suggestions,
        selectedClipId: suggestions[0]?.id ?? null,
        faceKeyframesByClip: {},
        step: suggestions.length ? "select" : "upload",
      };
      invalidateClipOutputs();
      commitProject(next);
      setSelectedForBatch(suggestions.map((clip) => clip.id));
      const reviewCount = suggestions.filter((clip) => clip.quality === "review").length;
      const warningNotice = transcription.warnings.length ? " Whisper also flagged timestamp, overlap, or end-of-audio activity for review." : "";
      setNotice(suggestions.length ? `Analysis complete. ${suggestions.length} distinct candidate clip${suggestions.length === 1 ? " was" : "s were"} selected from the timed transcript.${reviewCount ? ` ${reviewCount} require${reviewCount === 1 ? "s" : ""} transcript review before publishing.` : ""}${warningNotice}` : `The words were transcribed, but no short self-contained segments were found. Add a manual clip or adjust the source language and retry.${warningNotice}`);
      if (suggestions.length) setStep("select");
      setRetryAction(null);
    } catch (cause) {
      if (isCurrent()) {
        setRetryAction("analysis");
        if (cause instanceof DOMException && cause.name === "AbortError") setNotice("Speech analysis cancelled. Your source and current edits are unchanged; you can try again.");
        else setError(cause instanceof Error ? cause.message : "Local analysis failed.");
      }
    } finally {
      if (isOperationOwner(controller, analysisController.current)) {
        setIsAnalyzing(false);
        analysisController.current = null;
      }
    }
  }

  function cancelAnalysis() { analysisController.current?.abort(); }

  function retryLastOperation() {
    const action = retryAction;
    setRetryAction(null);
    setError("");
    if (action === "analysis") void runTranscription();
    else if (action === "translation") void runTranslation();
    else if (action === "face") void runFaceTracking();
    else if (action === "export-one") void exportOne();
    else if (action === "export-batch") void exportBatch();
  }

  function addManualClip() {
    if (!project) return;
    const start = Math.max(0, Math.min(currentTime, Math.max(0, project.duration - 1)));
    const clip: ClipSuggestion = {
      id: `manual-${Date.now()}`,
      start,
      end: Math.min(project.duration, start + Math.min(30, Math.max(1, project.duration - start))),
      score: 0,
      reasons: ["Manual cut: choose the in/out points yourself."],
      transcript: "",
      hookOptions: [],
      titleOptions: [],
      selectedTitle: `Property cut ${project.clips.length + 1}`,
      description: "",
      hashtags: [],
      callsToAction: [],
    };
    commitProject({ ...project, clips: [...project.clips, clip], selectedClipId: clip.id, step: "edit" });
    setSelectedForBatch((current) => [...current, clip.id]);
    setStep("edit");
    setCurrentTime(start);
  }

  function chooseClip(clip: ClipSuggestion, nextStep: StepId = "edit") {
    if (!project) return;
    commitProject({ ...project, selectedClipId: clip.id, step: nextStep });
    setStep(nextStep);
    setCurrentTime(clip.start);
    if (videoRef.current) { videoRef.current.currentTime = clip.start; videoRef.current.pause(); }
  }

  function reviewSourceTail() {
    if (!project) return;
    const clip = activeClip ?? project.clips[0];
    if (clip) commitProject({ ...project, selectedClipId: clip.id, step: "edit" });
    setStep("edit");
    const reviewTime = Math.max(0, project.duration - Math.min(5, project.duration));
    setCurrentTime(reviewTime);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = reviewTime;
    }
  }

  function updateClip(clipId: string, patch: Partial<ClipSuggestion>) {
    if (!project) return;
    let changedBoundaries = false;
    let newStart: number | null = null;
    const clips = project.clips.map((clip) => {
      if (clip.id !== clipId) return clip;
      const hookIndex = patch.selectedHook ? clip.hookOptions.indexOf(patch.selectedHook) : -1;
      const hookStart = hookIndex >= 0 ? clip.hookStartOptions?.[hookIndex] : undefined;
      const next = { ...clip, ...patch, ...(hookStart !== undefined ? { start: hookStart } : {}) };
      if (patch.selectedHook !== undefined && !patch.selectedHook.trim()) next.selectedHook = undefined;
      if (patch.start !== undefined || patch.end !== undefined || hookStart !== undefined) {
        changedBoundaries = true;
        next.start = Math.max(0, Math.min(next.start, project.duration - 0.1));
        next.end = Math.min(project.duration, Math.max(next.start + 0.25, next.end));
        newStart = next.start;
      }
      if (patch.start !== undefined && hookStart === undefined) {
        const matchingHook = clip.hookStartOptions?.findIndex((start) => Math.abs(start - next.start) < 0.06) ?? -1;
        next.selectedHook = matchingHook >= 0 ? clip.hookOptions[matchingHook] : undefined;
      }
      return next;
    });
    const faceKeyframesByClip = { ...project.faceKeyframesByClip };
    if (changedBoundaries) delete faceKeyframesByClip[clipId];
    invalidateClipOutputs([clipId]);
    commitProject({ ...project, clips, faceKeyframesByClip });
    if (newStart !== null && videoRef.current) { videoRef.current.currentTime = newStart; setCurrentTime(newStart); }
  }

  function updateCaptionCue(cue: CaptionCue, patch: Partial<Pick<CaptionCue, "text" | "start" | "end">>) {
    if (!project || !activeClip) return;
    const sourceWord = cue.id.startsWith(WORD_CUE_PREFIX) && cue.words.length === 1
      ? project.words.find((word) => word.id === cue.words[0].id)
      : undefined;
    if (sourceWord) {
      const requestedStart = patch.start ?? sourceWord.start;
      const start = Number.isFinite(requestedStart) ? Math.max(activeClip.start, Math.min(requestedStart, activeClip.end - 0.05)) : sourceWord.start;
      const requestedEnd = patch.end ?? sourceWord.end;
      const end = Number.isFinite(requestedEnd) ? Math.max(start + 0.05, Math.min(requestedEnd, activeClip.end)) : Math.max(start + 0.05, sourceWord.end);
      const updatedWord = { ...sourceWord, ...(patch.text !== undefined ? { text: patch.text } : {}), start, end };
      const words = project.words.flatMap((word) => word.id !== sourceWord.id ? [word] : patch.text !== undefined && !patch.text.trim() ? [] : [updatedWord]).sort((a, b) => a.start - b.start);
      const baseCues = project.editedCues.length ? project.editedCues : buildCaptionCues(project.words);
      const editedCues = baseCues.flatMap((item) => {
        if (!item.words.some((word) => word.id === sourceWord.id)) return [item];
        const nextWords = item.words.flatMap((word) => word.id !== sourceWord.id ? [word] : patch.text !== undefined && !patch.text.trim() ? [] : [updatedWord]);
        if (!nextWords.length) return [];
        return [{ ...item, words: nextWords, start: Math.min(...nextWords.map((word) => word.start)), end: Math.max(...nextWords.map((word) => word.end)), text: joinTranscriptWords(nextWords) }];
      });
      const affectedClips = project.clips.filter((clip) => clip.end >= Math.min(sourceWord.start, updatedWord.start) && clip.start <= Math.max(sourceWord.end, updatedWord.end)).map((clip) => clip.id);
      invalidateClipOutputs(affectedClips);
      commitProject({ ...project, words, editedCues, translatedCues: [], translatedLanguage: "none" });
      if (project.translatedCues.length) setNotice("Source captions changed. Re-run translation if you want a translated track for these edits.");
      return;
    }
    const isTranslated = cue.id.startsWith(`translated-${project.translatedLanguage}-`);
    const affectedClips = isTranslated
      ? project.clips.filter((clip) => clip.end >= cue.start && clip.start <= cue.end).map((clip) => clip.id)
      : undefined;
    invalidateClipOutputs(affectedClips);
    const all = (isTranslated ? project.translatedCues : sourceCues(project)).map((item) => ({ ...item }));
    const nextCues = all.map((item) => item.id === cue.id ? applyCaptionCuePatch(item, patch, activeClip.start, activeClip.end) : item);
    if (isTranslated) commitProject({ ...project, translatedCues: nextCues });
    else {
      commitProject({ ...project, editedCues: nextCues, translatedCues: [], translatedLanguage: "none" });
      if (project.translatedCues.length) setNotice("Source captions changed. Re-run translation if you want a translated track for these edits.");
    }
  }

  function addManualCaptionCue() {
    if (!project || !activeClip) return;
    if (currentTime >= activeClip.end - 0.05) {
      setNotice("Extend the clip end to include the audio you reviewed, then add a caption line at the playhead.");
      return;
    }
    const start = Math.max(activeClip.start, Math.min(currentTime, activeClip.end - 0.05));
    const cue: CaptionCue = {
      id: `manual-cue-${Date.now()}`,
      start,
      end: Math.min(activeClip.end, start + 1.6),
      text: "",
      words: [],
    };
    invalidateClipOutputs([activeClip.id]);
    commitProject({
      ...project,
      editedCues: [...sourceCues(project), cue].sort((a, b) => a.start - b.start),
      translatedCues: [],
      translatedLanguage: "none",
    });
    setNotice("Type the words you hear in the new caption line. Its timing and audio will be included in the next export.");
  }

  async function importCaptions(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";
    if (!file || !project) return;
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Subtitle files larger than 20 MB are not supported.");
      const cues = parseSubtitleFile(await file.text());
      invalidateClipOutputs();
      commitProject({ ...project, editedCues: cues, translatedCues: [], translatedLanguage: "none" });
      setNotice(`Imported ${cues.length} caption lines locally from ${file.name}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read that subtitle file.");
    }
  }

  async function runTranslation() {
    if (!project || !activeClip || !currentCues.length) return;
    if (isBusy) { setError("Finish or cancel the current operation before starting translation."); return; }
    if (project.sourceLanguage !== "en") {
      setError("These local translation models accept English source captions only. Set Speech language to English, transcribe again, and review the source captions first.");
      return;
    }
    if (settings.targetLanguage === "none") {
      setError("Choose French, Spanish, or German as the target language first.");
      return;
    }
    setError("");
    setRetryAction(null);
    setIsTranslating(true);
    const controller = new AbortController();
    translationController.current = controller;
    const revision = projectRevision.current;
    const projectId = project.id;
    const clipId = activeClip.id;
    const targetLanguage = settings.targetLanguage;
    const identity = { projectRevision: revision, projectId, clipId, targetLanguage };
    const isCurrent = () => isOperationOwner(controller, translationController.current) && isCurrentTranslation(identity, {
      projectRevision: projectRevision.current,
      projectId: project.id,
      clipId: project.selectedClipId ?? "",
      targetLanguage: targetLanguageRef.current,
    });
    const reportProgress = (progress: TranslationProgress) => { if (isCurrent()) setTranslationProgress(progress); };
    try {
      const inClip = sourceCues(project).filter((cue) => cue.end >= activeClip.start && cue.start <= activeClip.end);
      const translated = await translateCues(inClip, targetLanguage, reportProgress, controller.signal);
      if (!isCurrent()) return;
      invalidateClipOutputs([activeClip.id]);
      const keep = project.translatedCues.filter((cue) => !inClip.some((source) => cue.id === `translated-${targetLanguage}-${source.id}`));
      commitProject({ ...project, translatedCues: [...keep, ...translated].sort((a, b) => a.start - b.start), translatedLanguage: targetLanguage });
      setNotice(`Translated ${translated.length} caption lines on this device. Word-by-word timing is approximate; review the result before export.`);
      setRetryAction(null);
    } catch (cause) {
      if (isCurrent()) {
        setRetryAction("translation");
        if (cause instanceof DOMException && cause.name === "AbortError") setNotice("Translation cancelled. Your source captions remain available for another attempt.");
        else setError(cause instanceof Error ? cause.message : "Local translation failed.");
      }
    } finally {
      if (isOperationOwner(controller, translationController.current)) {
        setIsTranslating(false);
        translationController.current = null;
      }
    }
  }

  async function runFaceTracking() {
    if (!project || !sourceFile || !activeClip) return;
    if (isBusy) { setError("Finish or cancel the current operation before starting face tracking."); return; }
    setError("");
    setRetryAction(null);
    setIsTrackingFace(true);
    const controller = new AbortController();
    faceController.current = controller;
    const generation = sourceGeneration.current;
    const revision = projectRevision.current;
    const projectId = project.id;
    const clipId = activeClip.id;
    const trackedStart = activeClip.start;
    const trackedEnd = activeClip.end;
    const identity = { sourceGeneration: generation, projectRevision: revision, projectId, clipId, clipStart: trackedStart, clipEnd: trackedEnd };
    const isCurrent = () => isOperationOwner(controller, faceController.current) && isCurrentFaceTrack(identity, {
      sourceGeneration: sourceGeneration.current,
      projectRevision: projectRevision.current,
      projectId: project.id,
      clipId: project.selectedClipId ?? "",
      clipStart: activeClip.start,
      clipEnd: activeClip.end,
    });
    const reportProgress = (progress: FaceTrackingProgress) => { if (isCurrent()) setFaceProgress(progress); };
    try {
      const keyframes = await trackLargestFace(sourceFile, activeClip.start, activeClip.end, controller.signal, reportProgress, { x: settings.manualCropX, y: settings.manualCropY });
      if (!isCurrent()) return;
      const summary = summarizeFaceTrack(keyframes, activeClip.end - activeClip.start);
      invalidateClipOutputs([activeClip.id]);
      commitProject({
        ...project,
        settings: { ...project.settings, smartFraming: true },
        faceKeyframesByClip: { ...project.faceKeyframesByClip, [activeClip.id]: keyframes },
      });
      setSettings({ ...settings, smartFraming: true });
      setNotice(summary.detectedCount < summary.sampleCount
        ? `Face detection returned at ${summary.detectedCount}/${summary.sampleCount} sampled times; held ${summary.heldCount} and used manual framing at ${summary.manualCount}. Longest detection gap: ${summary.longestDetectionGapSeconds.toFixed(1)} s. Review the crop—the tracker does not identify who is speaking.`
        : `Face detection returned at all ${summary.sampleCount} sampled times. The tracker does not identify who is speaking; review the crop before export.`);
      setRetryAction(null);
    } catch (cause) {
      if (isCurrent()) {
        changeSettings({ smartFraming: false });
        setRetryAction("face");
        if (cause instanceof DOMException && cause.name === "AbortError") setNotice("Face tracking cancelled. Manual framing is still available and your last saved framing was kept.");
        else setError(`${cause instanceof Error ? cause.message : "Face tracking could not run on this device."} Manual framing is active instead.`);
      }
    } finally {
      if (isOperationOwner(controller, faceController.current)) {
        setIsTrackingFace(false);
        faceController.current = null;
      }
    }
  }

  function cancelFaceTracking() { faceController.current?.abort(); }

  function chooseSubtitleForExport(clip: ClipSuggestion): CaptionCue[] {
    if (!project) return [];
    const translatedCues = translatedCuesForLanguage(project.translatedCues, settings.targetLanguage);
    const translatedForClip = translatedCues.some((cue) => cue.end >= clip.start && cue.start <= clip.end);
    const cues = settings.targetLanguage !== "none" && project.translatedLanguage === settings.targetLanguage && translatedForClip
      ? translatedCues
      : sourceCues(project);
    return settings.captionMode === "word" ? toWordCues(cues) : cues;
  }

  function outputRangesForClip(clip: ClipSuggestion) {
    const duration = clip.end - clip.start;
    return settings.silenceRemoval && project
      ? buildClipSpeechRanges(project.words, clip.start, clip.end, settings.silenceThresholdSeconds, project.editedCues)
      : [{ start: 0, end: duration }];
  }

  function exportCuesForClip(clip: ClipSuggestion): CaptionCue[] {
    const ranges = outputRangesForClip(clip);
    return mapCaptionCuesToOutput(chooseSubtitleForExport(clip), clip.start, clip.end, ranges, EXPORT_FRAME_RATE);
  }

  function exportCaptionFile(kind: "srt" | "vtt") {
    if (!activeClip) return;
    const cues = exportCuesForClip(activeClip);
    const text = kind === "srt" ? exportSrt(cues) : exportVtt(cues);
    downloadText(text, `${safeFileStem(clipTitle(activeClip, 0))}.${kind}`, kind === "srt" ? "application/x-subrip;charset=utf-8" : "text/vtt;charset=utf-8");
  }

  async function exportOne() {
    if (!project || !sourceFile || !activeClip || !outputFormat) return;
    if (isBusy) { setError("Finish or cancel the current operation before exporting."); return; }
    setError("");
    setRetryAction(null);
    setIsExporting(true);
    setExportProgress({ progress: 0, phase: "preparing", detail: "Preparing local video processing" });
    setBatchZip(null);
    setRenderStatuses((current) => ({ ...current, [activeClip.id]: "rendering" }));
    setClipProgress((current) => ({ ...current, [activeClip.id]: 0 }));
    setRenderErrors((current) => ({ ...current, [activeClip.id]: "" }));
    const controller = new AbortController();
    exportController.current = controller;
    let writable: FileWritable | null = null;
    try {
      const { requestSaveTarget, exportClip } = await import("@/features/studio/export/convert-clip");
      const extension = outputFormat === "mp4" ? "mp4" : "webm";
      const platformTag = settings.outputPlatform === "generic" ? "" : `${settings.outputPlatform}-`;
      const outputName = `${platformTag}${safeFileStem(clipTitle(activeClip, 0))}.${extension}`;
      if (hasSavePicker) writable = await requestSaveTarget(outputName, outputFormat);
      const converted = await exportClip({
        file: sourceFile, project, clip: activeClip, cues: exportCuesForClip(activeClip),
        faceKeyframes, format: outputFormat, writable, signal: controller.signal,
        onProgress: (progress) => {
          setExportProgress(progress);
          setClipProgress((current) => ({ ...current, [activeClip.id]: progress.progress }));
        },
      });
      const result = { ...converted, filename: outputName };
      setOutputs((current) => [{ result, clipId: activeClip.id, clipLabel: clipTitle(activeClip, 0) }, ...current]);
      setRenderStatuses((current) => ({ ...current, [activeClip.id]: "ready" }));
      setClipProgress((current) => ({ ...current, [activeClip.id]: 1 }));
      setNotice(result.streamed ? "Export saved using the browser’s direct-to-file writer." : "Export is ready. Use the save button below to download it.");
      setRetryAction(null);
    } catch (cause) {
      const cancelled = controller.signal.aborted || (cause instanceof DOMException && cause.name === "AbortError");
      const message = cause instanceof Error ? cause.message : "Export failed on this device.";
      setRetryAction("export-one");
      setRenderStatuses((current) => ({ ...current, [activeClip.id]: cancelled ? "cancelled" : "failed" }));
      if (cancelled) setNotice("Export cancelled. No incomplete file was added to the results.");
      else {
        setRenderErrors((current) => ({ ...current, [activeClip.id]: message }));
        setError(`${clipTitle(activeClip, 0)}: ${message}`);
      }
    } finally {
      setIsExporting(false);
      exportController.current = null;
    }
  }

  async function exportBatch() {
    if (!project || !sourceFile || !outputFormat) return;
    if (isBusy) { setError("Finish or cancel the current operation before exporting a batch."); return; }
    const clips = project.clips.filter((clip) => selectedForBatch.includes(clip.id));
    if (!clips.length) { setError("Select at least one clip for the batch."); return; }
    if (estimatedZipBytes > ZIP_LIMIT) { setError("This ZIP would exceed the safe in-browser memory budget. Choose 720p or export clips one at a time with direct file saving."); return; }
    setError("");
    setRetryAction(null);
    setIsExporting(true);
    setExportProgress({ progress: 0, phase: `Clip 1 of ${clips.length}: preparing`, detail: "Preparing local video processing" });
    setRenderStatuses(Object.fromEntries(clips.map((clip) => [clip.id, "queued" as const])));
    setClipProgress(Object.fromEntries(clips.map((clip) => [clip.id, 0])));
    setRenderErrors({});
    setOutputs([]);
    setBatchZip(null);
    const controller = new AbortController();
    exportController.current = controller;
    const batchResults: SavedOutput[] = [];
    const usedFilenames = new Set<string>();
    let currentClipId: string | null = null;
    try {
      const { exportClip } = await import("@/features/studio/export/convert-clip");
      for (let index = 0; index < clips.length; index += 1) {
        const clip = clips[index];
        currentClipId = clip.id;
        setRenderStatuses((current) => ({ ...current, [clip.id]: "rendering" }));
        const extension = outputFormat === "mp4" ? "mp4" : "webm";
        const platformTag = settings.outputPlatform === "generic" ? "" : `${settings.outputPlatform}-`;
        const outputName = uniqueFilename(`${platformTag}${safeFileStem(clipTitle(clip, index))}.${extension}`, usedFilenames);
        const converted = await exportClip({
          file: sourceFile, project, clip,
          cues: exportCuesForClip(clip),
          faceKeyframes: project.faceKeyframesByClip[clip.id] ?? [],
          format: outputFormat,
          signal: controller.signal,
          onProgress: (progress) => {
            setExportProgress({
              progress: (index + progress.progress) / clips.length,
              phase: `Clip ${index + 1} of ${clips.length}: ${progress.phase}`,
              detail: progress.detail,
            });
            setClipProgress((current) => ({ ...current, [clip.id]: progress.progress }));
          },
        });
        const result = { ...converted, filename: outputName };
        batchResults.push({ result, clipId: clip.id, clipLabel: clipTitle(clip, index) });
        setRenderStatuses((current) => ({ ...current, [clip.id]: "ready" }));
        setClipProgress((current) => ({ ...current, [clip.id]: 1 }));
        setOutputs([...batchResults]);
        currentClipId = null;
      }
      const actualBytes = batchResults.reduce((sum, item) => sum + item.result.byteLength, 0);
      const zipEntries = await Promise.all(batchResults.filter((item) => item.result.blob).map(async (item) => ({
        name: item.result.filename,
        data: new Uint8Array(await item.result.blob!.arrayBuffer()),
      })));
      if (zipEntries.length === batchResults.length && actualBytes <= ZIP_LIMIT) {
        setBatchZip(createZip(zipEntries));
        setNotice(`Finished ${batchResults.length} clips. You can save each one or download the ZIP.`);
      } else {
        setNotice(`Finished ${batchResults.length} clips, but the combined files exceed the ZIP memory limit. Save them individually below.`);
      }
      setRetryAction(null);
    } catch (cause) {
      const cancelled = controller.signal.aborted || (cause instanceof DOMException && cause.name === "AbortError");
      const failedClip = clips.find((clip) => clip.id === currentClipId);
      setRetryAction("export-batch");
      setRenderStatuses((current) => {
        const next = { ...current };
        if (currentClipId) next[currentClipId] = cancelled ? "cancelled" : "failed";
        if (cancelled) for (const clip of clips) if (next[clip.id] === "queued") next[clip.id] = "cancelled";
        return next;
      });
      if (cancelled) setNotice("Batch cancelled. Completed clips remain available below.");
      else {
        const message = cause instanceof Error ? cause.message : "The clip batch stopped. Completed clips remain available below.";
        if (currentClipId) setRenderErrors((current) => ({ ...current, [currentClipId!]: message }));
        setError(`${failedClip ? clipTitle(failedClip, clips.indexOf(failedClip)) : "Batch export"}: ${message}`);
      }
    } finally {
      setIsExporting(false);
      exportController.current = null;
    }
  }

  async function downloadZip() {
    if (!batchZip || !project) return;
    downloadBlob(batchZip, `${safeFileStem(project.name)}-clips.zip`);
  }

  async function downloadOutput(item: SavedOutput) {
    if (item.result.blob) downloadBlob(item.result.blob, item.result.filename);
  }

  async function copyPostText() {
    if (!activeClip) return;
    const title = clipTitle(activeClip, 0);
    const description = activeClip.editedDescription ?? activeClip.description;
    const hashtags = activeClip.editedHashtags ?? activeClip.hashtags.join(" ");
    const cta = activeClip.selectedCallToAction ?? activeClip.callsToAction[0] ?? "";
    const content = [title, description, hashtags, cta].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(content);
      setNotice("Post copy copied to the clipboard.");
    } catch {
      downloadText(content, `${safeFileStem(title)}-post-copy.txt`);
      setNotice("Clipboard permission was unavailable; the post copy was downloaded as a text file.");
    }
  }

  async function saveProjectSourceToggle() {
    if (!project || !sourceFile) return;
    await saveSourceLocally();
  }

  const fileButton = <button type="button" className="studio-button studio-button--secondary" onClick={() => fileInputRef.current?.click()} disabled={isBusy}><Upload size={16} />{pendingProject ? "Choose the original source" : "Choose a video"}</button>;
  const cueLanguage = settings.targetLanguage !== "none" && project?.translatedLanguage === settings.targetLanguage ? settings.targetLanguage.toUpperCase() : "SOURCE";

  return (
    <div className="studio-shell">
      <StudioHeader currentStep={step} onStep={goToStep} sourceReady={Boolean(project)} busy={isAnalyzing || isTranslating || isTrackingFace || isExporting} />
      <main className="studio-main">
        <input ref={fileInputRef} type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.3gp" className="sr-only" onChange={handleFileInput} />
        <input ref={captionInputRef} type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" className="sr-only" onChange={importCaptions} />
        {(error || notice) && <div className={`studio-alert${error ? " studio-alert--error" : " studio-alert--notice"}`} role={error ? "alert" : "status"}>
          {error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}<span>{error || notice}</span>{error && retryAction && <button type="button" className="studio-text-button" onClick={retryLastOperation}>Retry</button>}{error && <button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={15} /></button>}
        </div>}
        {project?.transcriptionWarnings?.length ? <div className="studio-inline-warning studio-transcription-warning" role="status">
          <AlertTriangle size={16} /><span>{transcriptionWarningText(project.transcriptionWarnings)}</span>
          <button type="button" className="studio-text-button" onClick={needsSourceTailReview(project.transcriptionWarnings) ? reviewSourceTail : () => setStep("select")} disabled={!sourceFile}>
            {needsSourceTailReview(project.transcriptionWarnings) ? "Review final audio" : "Review transcript"}
          </button>
        </div> : null}

        <section className="studio-step-panel" aria-labelledby="step-title">
          <div className="studio-step-panel__heading">
            <div><p className="studio-eyebrow">{step === "upload" ? "01 / SOURCE" : step === "select" ? "02 / MOMENTS" : step === "edit" ? "03 / FINISH" : "04 / DELIVERY"}</p>
              <h2 id="step-title">{step === "upload" ? "Start with a recording." : step === "select" ? "Choose the moments." : step === "edit" ? "Shape the final cut." : "Export on your terms."}</h2>
              <p>{step === "upload" ? "Nothing leaves your browser unless you separately submit the existing service inquiry form on the main site." : step === "select" ? "Suggestions come from timed speech and complete sentences. Every cut stays editable." : step === "edit" ? "Watch the crop, edit the words and set the brand before encoding." : "Use direct-to-file saving for longer exports, or a memory-limited ZIP for small batches."}</p>
            </div>
            <div className="studio-save-state"><span className={`studio-save-dot is-${saveState}`} />{saveState === "loading" ? "Opening local saves" : saveState === "saving" ? "Saving locally…" : saveState === "saved" ? "Local save ready" : "Local save unavailable"}</div>
          </div>

          {step === "upload" && <div className="studio-upload-layout">
            <div>
              <div className={`studio-dropzone${dragging ? " is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void acceptFile(file); }}>
                <span className="studio-dropzone__icon"><Upload size={23} /></span>
                <h3>{sourceFile ? "Source ready to work with." : "Drop a long video here."}</h3>
                <p>Choose a local video file. The page reads the file in your browser; it is not sent to the website.</p>
                {fileButton}
                <small>Primary supported scope: MP4 / H.264 up to {MAX_SOURCE_DIMENSION_PX} px, {Math.round(MAX_SOURCE_DURATION_SECONDS / 60)} minutes, and {formatBytes(MAX_SOURCE_FILE_BYTES)}. Other browser-decodable formats may work, but are not guaranteed.</small>
              </div>
              {sourceFile && project && metadata && <div className="studio-source-summary">
                <div className="studio-source-summary__file"><span><Film size={17} /></span><div><strong>{sourceFile.name}</strong><small>{formatBytes(sourceFile.size)} · {metadata.width} × {metadata.height} · {metadata.hasAudio ? "audio detected" : "no audio track"}</small></div></div>
                <div className="studio-source-summary__duration"><Clock3 size={15} />{formatTime(metadata.duration)}</div>
                <div className="studio-source-summary__actions">
                  <button type="button" className="studio-text-button" onClick={saveProjectSourceToggle} disabled={project.sourceSavedInOpfs || isBusy}><HardDrive size={14} />{isSavingSource ? "Saving source locally…" : project.sourceSavedInOpfs ? "Source saved on this device" : "Save source locally (optional)"}</button>
                  <span>{project.sourceSavedInOpfs ? "OPFS" : "Project notes auto-save; source file does not"}</span>
                  <button type="button" className="studio-text-button" onClick={() => void removeSource()} disabled={isBusy}><X size={14} />Remove source</button>
                </div>
              </div>}
              {sourceFile && sourceFile.size >= LARGE_FILE_WARNING_BYTES && <p className="studio-inline-warning"><AlertTriangle size={15} />This is a larger local file. Speech analysis is chunked, but browser memory and codec support still depend on the device. Export longer clips one at a time when possible.</p>}
              {sourceFile && project && <div className="studio-analysis-box">
                <div className="studio-panel-heading"><span className="studio-panel-heading__index">AI</span><div><p>LOCAL SPEECH ANALYSIS</p><h3>Find the moments in the words.</h3></div></div>
                <p className="studio-small-copy">Whisper Tiny runs in a worker on this device. First analysis may download about 41 MB of model files plus a 26.9 MB ONNX browser runtime (transfer compression and cache vary). Your video and transcript are not uploaded.</p>
                <div className="studio-analysis-controls">
                  <label className="studio-field">Speech language<select value={project.sourceLanguage} onChange={(event) => commitProject({ ...project, sourceLanguage: event.target.value })}>{LANGUAGE_OPTIONS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
                  {!isAnalyzing ? <button type="button" className="studio-button studio-button--dark" onClick={() => void runTranscription()} disabled={!metadata?.hasAudio || isBusy}><Sparkles size={16} />Analyze speech on this device</button> : <button type="button" className="studio-button studio-button--quiet" onClick={cancelAnalysis}><X size={15} />Stop analysis</button>}
                </div>
                {isAnalyzing && analysisProgress && <ProgressCard label={analysisProgress.stage === "model" ? "Getting the local speech model" : analysisProgress.detail} progress={analysisProgress.progress} />}
                {!metadata?.hasAudio && <p className="studio-inline-warning"><AlertTriangle size={15} />No audio was detected. You can still set clip points manually and export the video.</p>}
                <div className="studio-local-model-note"><ShieldCheck size={15} /><span>No paid inference API, account, or server upload is used by this editor. Model downloads are optional and cached by your browser.</span></div>
                <button type="button" className="studio-text-button" onClick={addManualClip} disabled={!sourceFile}><Plus size={14} />Skip analysis and set a cut manually</button>
              </div>}
            </div>
            <aside className="studio-saved-panel">
              <div className="studio-saved-panel__heading"><span><FolderOpen size={17} /></span><div><p>THIS BROWSER</p><h3>Saved projects</h3></div></div>
              {!savedProjects.length ? <p className="studio-empty-inline">Your local edit notes will appear here.</p> : <ul className="saved-project-list">{savedProjects.slice(0, 8).map((saved) => <li key={saved.id}>
                <button type="button" className="saved-project-open" onClick={() => void openSavedProject(saved)} disabled={isBusy}><span><strong>{saved.name}</strong><small>{formatTime(saved.duration)} · {prettyDate(saved.updatedAt)}</small></span><ArrowRight size={15} /></button>
                <button type="button" className="saved-project-delete" onClick={() => void removeSavedProject(saved)} disabled={isBusy} aria-label={`Delete ${saved.name} from this browser`}><X size={14} /></button>
              </li>)}</ul>}
              {pendingProject && <div className="saved-project-reselect"><p>Source not stored. Select the original video matching <strong>{pendingProject.sourceFileName}</strong> ({formatBytes(pendingProject.sourceSize)}).</p>{fileButton}</div>}
              <div className="studio-local-footnote"><HardDrive size={14} /><span>Projects, settings and transcripts are stored in this browser’s local database. Clear browser storage and project notes may be removed.</span></div>
            </aside>
          </div>}

          {step === "select" && project && <div className="studio-select-layout">
            <div className="studio-suggestion-column">
              <div className="studio-section-heading"><div><span className="studio-mini-label">{project.clips.length} SUGGESTIONS</span><h3>Short cuts with context.</h3></div><button type="button" className="studio-text-button" onClick={addManualClip}><Plus size={14} />Add manual clip</button></div>
              {!project.clips.length && <div className="studio-empty-state"><Scissors size={25} /><h3>No candidate clips yet.</h3><p>Try speech analysis with the correct language, import captions, or add a manual cut.</p></div>}
              {project.clips.some((clip) => clip.qualityWarning) && <p className="studio-inline-warning"><AlertTriangle size={15} />Some suggestions have unreliable or repetitive transcript text. Review the transcript and preview before publishing.</p>}
              <div className="clip-suggestion-list">{project.clips.map((clip, index) => <article className={`clip-suggestion${clip.id === project.selectedClipId ? " is-selected" : ""}`} key={clip.id}>
                <div className="clip-suggestion__top"><span className="clip-suggestion__index">{String(index + 1).padStart(2, "0")}</span><span>{formatTime(clip.start)} — {formatTime(clip.end)}</span><span className="clip-suggestion__duration">{Math.round(clip.end - clip.start)} sec</span></div>
                <h4>{clip.transcript || clip.selectedTitle || "Manual clip"}</h4>
                <ul>{clip.reasons.slice(0, 3).map((reason) => <li key={reason}><Check size={13} />{reason}</li>)}</ul>
                {clip.qualityWarning && <p className="studio-inline-warning"><AlertTriangle size={14} />{clip.qualityWarning}</p>}
                <button type="button" className="studio-button studio-button--small" onClick={() => chooseClip(clip)}><span>{clip.id === project.selectedClipId ? "Selected — edit clip" : "Preview and edit"}</span><ArrowRight size={15} /></button>
              </article>)}</div>
              {project.words.length > 0 && <details className="studio-transcript-details"><summary><FileText size={16} />Review full transcript ({project.words.length} timed words)<span>Local text only</span></summary><p>{project.words.map((word) => word.text).join(" ")}</p></details>}
              <div className="studio-step-actions"><button type="button" className="studio-button studio-button--secondary" onClick={() => goToStep("upload")}><ArrowLeft size={15} />Back to source</button><button type="button" className="studio-button studio-button--dark" onClick={() => goToStep("edit")} disabled={!project.clips.length}>Refine selected clip <ArrowRight size={15} /></button></div>
            </div>
            <aside className="studio-clip-notes"><div className="studio-sticky-card"><p className="studio-eyebrow">HOW PICKS ARE MADE</p><h3>Transcript first.<br /><em>Always review.</em></h3><p>Suggestions use Whisper word timings, sentence boundaries, pauses and simple topic/number cues. They are not an opaque engagement score and are not guaranteed to perform.</p><div className="studio-sticky-card__divider" /><p>Use the in/out fields in the next step to change the cut. A manual clip is available when the recording has no speech.</p>{fileButton}</div></aside>
          </div>}

          {step === "edit" && project && sourceFile && previewUrl && <div className="studio-edit-layout">
            <div className="studio-edit-preview-column">
              {activeClip ? <VideoPreview src={previewUrl} clip={activeClip} cues={exportCuesForClip(activeClip)} ranges={outputRangesForClip(activeClip)} settings={settings} faceKeyframes={faceKeyframes} videoRef={videoRef} currentTime={currentTime} onTimeUpdate={setCurrentTime} /> : <div className="studio-empty-state"><Scissors size={22} /><p>Select a suggestion or create a manual clip.</p><button type="button" className="studio-button studio-button--secondary" onClick={addManualClip}><Plus size={15} />Add manual clip</button></div>}
              {activeClip && <div className="studio-cut-controls">
                <div className="studio-cut-controls__heading"><span className="studio-mini-label">IN / OUT POINTS</span><button type="button" className="studio-text-button" onClick={() => { if (videoRef.current) { videoRef.current.currentTime = activeClip.start; setCurrentTime(activeClip.start); void videoRef.current.play().catch(() => undefined); } }}><PlayIcon />Play this range</button></div>
                <div className="studio-time-row"><label>Start <span>seconds</span><input disabled={isTrackingFace} type="number" min="0" max={activeClip.end - 0.25} step="0.1" value={activeClip.start.toFixed(1)} onChange={(event) => updateClip(activeClip.id, { start: Number(event.target.value) })} /></label><label>End <span>seconds</span><input disabled={isTrackingFace} type="number" min={activeClip.start + 0.25} max={project.duration} step="0.1" value={activeClip.end.toFixed(1)} onChange={(event) => updateClip(activeClip.id, { end: Number(event.target.value) })} /></label><span className="studio-duration-pill">{Math.round(activeClip.end - activeClip.start)} sec</span></div>
                <div className="studio-cut-range"><input disabled={isTrackingFace} aria-label="Adjust clip start" type="range" min="0" max={Math.max(0, activeClip.end - 0.5)} step="0.1" value={activeClip.start} onChange={(event) => updateClip(activeClip.id, { start: Number(event.target.value) })} /><input disabled={isTrackingFace} aria-label="Adjust clip end" type="range" min={activeClip.start + 0.5} max={project.duration} step="0.1" value={activeClip.end} onChange={(event) => updateClip(activeClip.id, { end: Number(event.target.value) })} /></div>
              </div>}
              {activeClip && <section className="studio-panel studio-captions-panel">
                <div className="studio-panel-heading"><span className="studio-panel-heading__index">04</span><div><p>CAPTIONS / {cueLanguage}</p><h3>Words, in time.</h3></div><button type="button" className="studio-text-button" onClick={() => captionInputRef.current?.click()}><FileDown size={14} />Import SRT/VTT</button></div>
                {settings.targetLanguage !== "none" && <div className="studio-translation-row"><label className="studio-field">Target language<select value={settings.targetLanguage} onChange={(event) => changeSettings({ targetLanguage: event.target.value as StudioSettings["targetLanguage"] })} disabled={isBusy}><option value="none">No translation</option><option value="fr">French</option><option value="es">Spanish</option><option value="de">German</option></select></label><button type="button" className="studio-button studio-button--secondary" onClick={() => void runTranslation()} disabled={isTranslating || (isBusy && !isTranslating) || !currentCues.length || project.sourceLanguage !== "en"}><Languages size={15} />{isTranslating ? "Translating…" : "Translate this clip locally"}</button></div>}
                {settings.targetLanguage === "none" && <div className="studio-translation-row"><label className="studio-field">Target language<select value={settings.targetLanguage} onChange={(event) => changeSettings({ targetLanguage: event.target.value as StudioSettings["targetLanguage"] })}><option value="none">No translation</option><option value="fr">French</option><option value="es">Spanish</option><option value="de">German</option></select></label><p className="studio-small-copy">Translation is optional. It runs locally with WebAssembly on CPU; first use may download about 215–235 MiB of model files per language and can be slower on modest devices. English source only.</p></div>}
                {settings.targetLanguage !== "none" && <p className="studio-small-copy">This translation runs on your device with WebAssembly (CPU); first use may download about 215–235 MiB for the selected language. English source only; speed depends on your device.</p>}
                {settings.targetLanguage !== "none" && project.sourceLanguage !== "en" && <p className="studio-inline-warning"><AlertTriangle size={14} />Choose English under Speech language in Add source and run analysis again; Auto-detect does not set the source language for translation.</p>}
                {isTranslating && translationProgress && <><ProgressCard label={translationProgress.detail} progress={translationProgress.progress} /><button type="button" className="studio-text-button" onClick={() => translationController.current?.abort()}><X size={14} />Stop translation</button></>}
                {project.translatedLanguage !== "none" && <p className="studio-inline-warning"><AlertTriangle size={14} />Translated lines are phrase-timed to the source; review meaning and timing. Word-level alignment is not inferred.</p>}
                <CaptionCueEditor cues={currentCues} clipStart={activeClip?.start ?? 0} clipEnd={activeClip?.end ?? project.duration} onChange={updateCaptionCue} onAddLine={addManualCaptionCue} />
                {activeClip && <div className="caption-export-links"><button type="button" onClick={() => exportCaptionFile("srt")}><Download size={14} />Download SRT</button><button type="button" onClick={() => exportCaptionFile("vtt")}><Download size={14} />Download VTT</button><label><input type="checkbox" checked={settings.showCaptions} onChange={(event) => changeSettings({ showCaptions: event.target.checked })} /> Burn captions into video</label></div>}
              </section>}
            </div>

            <aside className="studio-edit-sidebar">
              {activeClip && <section className="studio-panel studio-clip-copy">
                <div className="studio-panel-heading"><span className="studio-panel-heading__index">03</span><div><p>POST COPY</p><h3>Shape the first line.</h3></div></div>
                <label className="studio-field">Opening hook<select value={activeClip.selectedHook ?? ""} onChange={(event) => updateClip(activeClip.id, { selectedHook: event.target.value })} disabled={!activeClip.hookOptions.length}><option value="">Keep the current in-point</option>{activeClip.hookOptions.map((hook, index) => <option key={`${index}-${hook}`} value={hook}>{formatTime(activeClip.hookStartOptions?.[index] ?? activeClip.start)} · {hook}</option>)}</select><small>Choosing a transcript line moves the video in-point to that sentence.</small></label>
                <label className="studio-field">Title<input maxLength={120} value={activeClip.selectedTitle ?? activeClip.titleOptions[0] ?? ""} onChange={(event) => updateClip(activeClip.id, { selectedTitle: event.target.value })} placeholder="Write a concise title" /></label>
                {activeClip.titleOptions.length > 1 && <label className="studio-field">Transcript-based title options<select value={activeClip.selectedTitle ?? activeClip.titleOptions[0]} onChange={(event) => updateClip(activeClip.id, { selectedTitle: event.target.value })}>{activeClip.titleOptions.map((title) => <option key={title} value={title}>{title}</option>)}</select></label>}
                <label className="studio-field">Description<textarea rows={3} value={activeClip.editedDescription ?? activeClip.description} onChange={(event) => updateClip(activeClip.id, { editedDescription: event.target.value })} placeholder="Use the transcript as the factual source." /></label>
                <label className="studio-field">Relevant tags<input value={activeClip.editedHashtags ?? activeClip.hashtags.join(" ")} onChange={(event) => updateClip(activeClip.id, { editedHashtags: event.target.value })} placeholder="#realestate #property" /></label>
                <label className="studio-field">Conversation prompt · generic template<input maxLength={180} value={activeClip.selectedCallToAction ?? activeClip.callsToAction[0] ?? ""} onChange={(event) => updateClip(activeClip.id, { selectedCallToAction: event.target.value })} placeholder="Write a question or invitation" /></label>
                <p className="studio-copy-disclaimer">Titles, descriptions and topic tags use the transcript. Conversation prompts are generic editable templates, not words from the recording. Check names and figures before posting.</p>
                <button type="button" className="studio-text-button" onClick={() => void copyPostText()}><FileText size={14} />Copy or download post copy</button>
              </section>}

              <section className="studio-panel studio-processing-panel">
                <div className="studio-panel-heading"><span className="studio-panel-heading__index">06</span><div><p>PICTURE / SOUND</p><h3>Choose your finish.</h3></div></div>
                <label className="studio-toggle-row"><span><strong>Remove long pauses</strong><small>Uses transcript gaps, with a small speech pad.</small></span><input type="checkbox" checked={settings.silenceRemoval} onChange={(event) => changeSettings({ silenceRemoval: event.target.checked })} /></label>
                {settings.silenceRemoval && <label className="studio-field studio-range-field">Remove a gap longer than {settings.silenceThresholdSeconds.toFixed(1)} s<input type="range" min="0.7" max="2.5" step="0.1" value={settings.silenceThresholdSeconds} onChange={(event) => changeSettings({ silenceThresholdSeconds: Number(event.target.value) })} /><small>Review before export; pauses are inferred from transcription timestamps.</small></label>}
                <label className="studio-toggle-row"><span><strong>Peak-normalize audio</strong><small>Sets the measured peak near −1 dBFS; not LUFS mastering.</small></span><input type="checkbox" checked={settings.peakNormalize} onChange={(event) => changeSettings({ peakNormalize: event.target.checked })} /></label>
                <label className="studio-toggle-row"><span><strong>Overlay the selected title</strong><small>Brand-colored title card for the first 2.8 seconds of the clip.</small></span><input type="checkbox" checked={settings.showTitleCard} onChange={(event) => changeSettings({ showTitleCard: event.target.checked })} /></label>
                <div className="studio-reframe-card"><div><span className="studio-feature-icon"><ScanFace size={16} /></span><div><strong>Follow a face</strong><small>Local face detection; speaker identity is not inferred.</small></div></div><button type="button" className={`studio-button studio-button--small${settings.smartFraming ? " studio-button--copper" : " studio-button--secondary"}`} onClick={() => isTrackingFace ? cancelFaceTracking() : settings.smartFraming ? changeSettings({ smartFraming: false }) : void runFaceTracking()} disabled={!activeClip || (isBusy && !isTrackingFace)}>{isTrackingFace ? "Stop face scan" : settings.smartFraming ? "Auto crop on" : "Find face"}</button></div>
                {isTrackingFace && faceProgress && <ProgressCard label={`Checking frame ${faceProgress.completed} of ${faceProgress.total}`} progress={faceProgress.completed / Math.max(1, faceProgress.total)} />}
                {settings.smartFraming && faceKeyframes.length === 0 && <p className="studio-inline-warning"><AlertTriangle size={14} />No saved face track for this clip. Run face detection or turn auto framing off.</p>}
                {settings.smartFraming && faceTrackSummary && faceTrackSummary.detectedCount < faceTrackSummary.sampleCount && <p className="studio-inline-warning"><AlertTriangle size={14} />Face detections: {faceTrackSummary.detectedCount}/{faceTrackSummary.sampleCount} sample points · held {faceTrackSummary.heldCount} · manual fallback {faceTrackSummary.manualCount}. Review the crop; face detection does not identify the speaker.</p>}
                {settings.smartFraming && faceKeyframes.some((frame) => frame.framingSafe === false) && <p className="studio-inline-warning"><AlertTriangle size={14} />The conservative face/headroom margin estimate does not fit in the 9:16 crop at every sample; this is not body detection. Review the preview and adjust manual framing if needed.</p>}
                <label className="studio-field">Portrait framing mode<select value={settings.framingMode} onChange={(event) => changeSettings({ framingMode: event.target.value as StudioSettings["framingMode"] })}><option value="fill">Fill portrait frame · crop sides</option><option value="full">Show full video · studio background</option></select><small>{settings.framingMode === "full" ? "Keeps the complete landscape frame visible without stretching on a dark 9:16 canvas; the preview uses the same background as export." : "Fills 9:16 by cropping the sides. Use face tracking or the manual slider to keep the subject visible."}</small></label>
                <label className="studio-field studio-range-field">Manual horizontal framing<input type="range" min="0" max="1" step="0.01" value={settings.manualCropX} onChange={(event) => changeSettings({ manualCropX: Number(event.target.value) })} /><small>Use this if automatic face framing is unavailable or off-center.</small></label>
                {settings.framingMode === "fill" && project.width / project.height < 9 / 16 && <label className="studio-field studio-range-field">Manual vertical framing<input type="range" min="0" max="1" step="0.01" value={settings.manualCropY} onChange={(event) => changeSettings({ manualCropY: Number(event.target.value) })} /><small>Shift the portrait crop up or down for this extra-tall source.</small></label>}
                <label className="studio-field">Export resolution<select value={settings.outputHeight} onChange={(event) => changeSettings({ outputHeight: Number(event.target.value) as StudioSettings["outputHeight"] })}><option value={1920}>1080 × 1920 · higher quality</option><option value={1280}>720 × 1280 · lighter files</option></select></label>
                {portraitQuality?.isUpscaled && <p className="studio-inline-warning"><AlertTriangle size={14} />This portrait crop uses about {portraitQuality.cropWidth}×{portraitQuality.cropHeight} source pixels and will be enlarged to {portraitQuality.outputWidth}×{portraitQuality.outputHeight}. Higher output dimensions cannot restore detail missing from the original crop.</p>}
                <div className="studio-codec-note"><span className={outputFormat ? "codec-ready" : "codec-warn"} />{outputFormat ? `${outputFormat === "mp4" ? "MP4 / H.264 + AAC" : outputFormat === "webm-vp8" ? "WebM / VP8 + Opus" : "WebM / VP9 + Opus"} detected on this device` : "This browser does not report a compatible local video and audio encoder."}</div>
              </section>
              <BrandControls settings={settings} onChange={changeSettings} />
              {activeClip && <div className="studio-step-actions studio-step-actions--sidebar"><button type="button" className="studio-button studio-button--secondary" onClick={() => goToStep("select")}><ArrowLeft size={15} />Moments</button><button type="button" className="studio-button studio-button--dark" onClick={() => goToStep("export")}>Export <ArrowRight size={15} /></button></div>}
            </aside>
          </div>}

          {step === "export" && project && sourceFile && <div className="studio-export-layout">
            <div className="studio-export-main">
              <section className="studio-panel studio-queue-panel">
                <div className="studio-panel-heading"><span className="studio-panel-heading__index">07</span><div><p>CLIP QUEUE</p><h3>Choose what to render.</h3></div><button type="button" className="studio-text-button" onClick={() => setSelectedForBatch(project.clips.map((clip) => clip.id))} disabled={isExporting}>Select all</button></div>
                {!project.clips.length ? <div className="studio-empty-inline"><Scissors size={17} /><span>There are no clips yet.</span><button type="button" className="studio-text-button" onClick={addManualClip}><Plus size={14} />Set a manual cut</button></div> : project.clips.map((clip, index) => {
                  const status = renderStatuses[clip.id];
                  const hasOutput = outputs.some((item) => item.clipId === clip.id);
                  const preparing = status === "rendering" && Boolean(exportProgress?.phase.toLowerCase().includes("preparing"));
                  return <div className="export-queue-row" key={clip.id}>
                    <input type="checkbox" aria-label={`Include ${clipTitle(clip, index)} in batch`} checked={selectedForBatch.includes(clip.id)} disabled={isExporting} onChange={(event) => setSelectedForBatch((current) => event.target.checked ? [...new Set([...current, clip.id])] : current.filter((id) => id !== clip.id))} />
                    <span className="export-queue-row__number">{String(index + 1).padStart(2, "0")}</span><span className="export-queue-row__text"><strong>{clipTitle(clip, index)}</strong><small>{formatTime(clip.start)} — {formatTime(clip.end)} · {Math.round(clip.end - clip.start)} sec</small></span>
                    <div className="export-queue-row__status-stack">
                      <span className={`export-queue-row__status is-${status ?? (hasOutput ? "ready" : "idle")}`}>{status === "rendering" ? preparing ? "Preparing…" : `${Math.round(Math.max(0, Math.min(1, clipProgress[clip.id] ?? 0)) * 100)}%` : renderStatusLabel(status, hasOutput)}</span>
                      {status === "rendering" && <progress className="export-queue-row__progress" max="100" {...(preparing ? {} : { value: Math.round(Math.max(0, Math.min(1, clipProgress[clip.id] ?? 0)) * 100) })} aria-label={`${preparing ? "Preparing" : "Rendering"} ${clipTitle(clip, index)}`} />}
                      {renderErrors[clip.id] && <small className="export-queue-row__error">{renderErrors[clip.id]}</small>}
                    </div>
                    <button type="button" className="studio-text-button" onClick={(event) => { event.preventDefault(); chooseClip(clip, "edit"); }} disabled={isExporting}><span className="sr-only">Edit</span><ArrowRight size={15} /></button>
                  </div>;
                })}
                <div className="studio-export-summary"><label className="studio-field studio-output-profile">TARGET<select value={settings.outputPlatform} disabled={isExporting} onChange={(event) => changeSettings({ outputPlatform: event.target.value as StudioSettings["outputPlatform"] })}><option value="generic">General vertical</option><option value="tiktok">TikTok</option><option value="instagram-reels">Instagram Reels</option><option value="youtube-shorts">YouTube Shorts</option></select></label><div><span>SHARED 9:16 PROFILE</span><strong>{settings.outputHeight === 1920 ? "1080 × 1920 · 30 fps" : "720 × 1280 · 30 fps"}</strong></div><div><span>FORMAT</span><strong>{outputFormat ? outputFormat.startsWith("webm") ? "WebM" : "MP4" : "Not supported"}</strong></div><div><span>MEDIA</span><strong>Local device only</strong></div></div>
                <p className="studio-profile-note">Targets share one vertical encoding profile; the target label is added to the filename, not a guarantee of platform approval. Confirm current upload rules before posting.</p>
                {project.clips.length > 0 && <div className="studio-export-buttons"><button type="button" className="studio-button studio-button--secondary" onClick={() => void exportOne()} disabled={isBusy || !activeClip || !outputFormat}><Download size={16} />Export selected clip</button><button type="button" className="studio-button studio-button--dark" onClick={() => void exportBatch()} disabled={isBusy || !outputFormat || !selectedForBatch.length || estimatedZipBytes > ZIP_LIMIT}><Package size={16} />{isExporting ? "Rendering batch…" : "Render selected + ZIP"}</button></div>}
                {estimatedZipBytes > ZIP_LIMIT && <p className="studio-inline-warning"><AlertTriangle size={14} />Estimated batch exceeds the 64 MB ZIP memory budget. Use 720p or export clips individually to a file.</p>}
                {!outputFormat && <p className="studio-inline-warning"><AlertTriangle size={14} />No supported WebCodecs encoder pair is available. Try an up-to-date desktop Chromium browser.</p>}
                {isExporting && exportProgress && <div className="studio-progress-block"><ProgressCard label={exportProgress.phase} progress={exportProgress.progress} indeterminate={exportProgress.phase.toLowerCase().includes("preparing")} /><p>{exportProgress.detail}</p><button type="button" className="studio-text-button" onClick={() => exportController.current?.abort()}><X size={14} />Cancel processing</button></div>}
              </section>
              {(outputs.length > 0 || batchZip) && <section className="studio-panel studio-results-panel"><div className="studio-panel-heading"><span className="studio-panel-heading__index">✓</span><div><p>READY ON THIS DEVICE</p><h3>Your finished files.</h3></div></div>
                {outputs.map((item) => <div className="studio-output-row" key={`${item.clipId}-${item.result.filename}`}><span><CheckCircle2 size={18} /></span><div><strong>{item.clipLabel}</strong><small>{formatBytes(item.result.byteLength)} · {item.result.streamed ? "saved to chosen file" : item.result.filename}</small></div>{item.result.blob && <button type="button" className="studio-button studio-button--small" onClick={() => void downloadOutput(item)}><Download size={14} />Save file</button>}</div>)}
                {batchZip && <button type="button" className="studio-button studio-button--copper studio-button--wide" onClick={() => void downloadZip()}><Package size={16} />Download all as ZIP ({formatBytes(batchZip.size)})</button>}
              </section>}
              <div className="studio-export-copy"><ShieldCheck size={17} /><p>Export is a local browser operation. The video, captions and model inputs are not sent to Frame &amp; Key’s lead form, cloud storage or a paid AI service.</p></div>
            </div>
            <aside className="studio-export-sidebar">
              <VideoPreview src={previewUrl} clip={activeClip} cues={activeClip ? exportCuesForClip(activeClip) : currentCues} ranges={activeClip ? outputRangesForClip(activeClip) : []} settings={settings} faceKeyframes={faceKeyframes} videoRef={videoRef} currentTime={currentTime} onTimeUpdate={setCurrentTime} />
              <div className="studio-download-note"><h3>Long clip?</h3><p>On browsers with direct file saving, each export streams to the chosen file. Without that API, the editor limits in-memory exports and ZIP batches to protect device memory.</p><div><HardDrive size={15} />No server upload</div></div>
              <button type="button" className="studio-button studio-button--secondary studio-button--wide" onClick={() => goToStep("edit")}><ArrowLeft size={15} />Back to editing</button>
            </aside>
          </div>}
        </section>

        <footer className="studio-footer"><span>FRAME &amp; KEY / LOCAL STUDIO</span><p>Open source tools. No media uploads. No payment system.</p><a href="/">Back to Frame &amp; Key</a>
          <details className="studio-footer-credits"><summary>Model and open-source credits</summary><p>Mediabunny (MPL-2.0), Transformers.js and TensorFlow.js (Apache-2.0), and fflate (MIT).</p><p><a href="https://huggingface.co/Xenova/whisper-tiny" target="_blank" rel="noreferrer">Whisper Tiny · Apache-2.0</a>. Optional English→French/Spanish/German OPUS-MT models are credited to Helsinki-NLP under CC BY 4.0: <a href="https://huggingface.co/onnx-community/opus-mt-en-fr" target="_blank" rel="noreferrer">French</a>, <a href="https://huggingface.co/onnx-community/opus-mt-en-es" target="_blank" rel="noreferrer">Spanish</a> and <a href="https://huggingface.co/onnx-community/opus-mt-en-de" target="_blank" rel="noreferrer">German</a>. Model files download only when you run the related local feature; selected Q8 translation models are about 215–235 MiB per language. They run on CPU via WebAssembly; WebGPU is not required.</p><p>Videos, audio and transcripts stay on this device. See the project’s THIRD_PARTY_NOTICES.md for full package and model sources.</p></details>
        </footer>
      </main>
    </div>
  );
}

function ProgressCard({ label, progress, indeterminate = false }: { label: string; progress: number; indeterminate?: boolean }) {
  const percent = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return <div className="studio-progress-card"><div><LoaderCircle size={15} className="studio-spinner" /><span>{label}</span>{!indeterminate && <strong>{percent}%</strong>}</div><progress max="100" {...(indeterminate ? {} : { value: percent })} aria-label={`${label} progress`}>{indeterminate ? `${label} in progress` : `${percent}%`}</progress></div>;
}

function PlayIcon() { return <span aria-hidden="true">▶</span>; }
