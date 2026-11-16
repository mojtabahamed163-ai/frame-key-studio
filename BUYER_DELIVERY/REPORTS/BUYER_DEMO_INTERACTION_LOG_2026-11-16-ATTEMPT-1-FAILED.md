# Buyer Demo Interaction Log — 2026-11-16

This log records the actual Playwright browser interactions used for the new continuous demo. The visible cursor is an in-page recording overlay, not a claim about the operating-system cursor. No artificial audio, narration, or music was added.

- Raw recording: `BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/Frame-and-Key-Studio-Buyer-Demo-2026-11-16.webm`
- Exported application WebM: `BUYER_DELIVERY/EXPORTS/Frame-and-Key-Studio-Buyer-Demo-Spanish-Export-2026-11-16.webm`

| # | Action | Clicked / targeted element | Result |
|---:|---|---|---|
| 1 | open | /studio | real local Frame & Key Studio loaded |
| 2 | click | Choose a video | real Playwright mouse down/up completed |
| 3 | import | Choose a video / source input | real source selected: Frame-and-Key-Studio-Original-Source.webm |
| 4 | wait | source import | observed: Source ready to work with. |
| 5 | wait | source metadata | observed: 1920 × 1080 |
| 6 | verify | source metadata | real app showed 1920 × 1080, audio detected, and 6:54 |
| 7 | select | Caption workflow | selected transcribe-only through the real UI control |
| 8 | select | Speech language | selected en through the real UI control |
| 9 | click | Analyze speech on this device | real Playwright mouse down/up completed |
| 10 | wait | Whisper transcription | waiting for actual local analysis; no result is fabricated |
| 11 | verify | transcription and suggested clips | real analysis completion message and suggested clip list appeared |
| 12 | observe | first suggested clip | real suggested clip text: "However, there are areas in which we believe that collaboration between states and non -state actors could produce results for improving the infrastructure of my country and other small island developing states. In the Pacific Islands, we collaborate on a range of issues such as in the in the sector, education. and in other capacity building needs." |
| 13 | click | Preview and edit first suggested clip | real Playwright mouse down/up completed |
| 14 | wait | caption editor | observed: Words, in time. |
| 15 | verify | clip editor | real suggested clip opened in editor with caption controls |
| 16 | finalize | Playwright recording | raw WebM finalized at /home/ubuntu/frame-key-studio/BUYER_DELIVERY/DEMO/Playwright-Raw-2026-11-16/Frame-and-Key-Studio-Buyer-Demo-2026-11-16.webm |
