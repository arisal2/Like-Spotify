# Producer decision log

The Producer owns every final decision. Proposed entries remain pending until
the Producer records approval, rejection, or a replacement direction.

| ID      | Status   | Decision                 | Recommended direction                                                                    | Producer outcome                                            |
| ------- | -------- | ------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| DEC-001 | Pending  | Primary launch user      | Prioritize independent game creators; keep learning producers secondary                  | —                                                           |
| DEC-002 | Pending  | First engine integration | Godot first, then Unity and Unreal examples                                              | —                                                           |
| DEC-003 | Pending  | MVP rendering boundary   | Browser preview and PCM WAV; isolated FFmpeg worker for canonical OGG and validation     | —                                                           |
| DEC-004 | Pending  | MVP output formats       | WAV and OGG with JSON manifest                                                           | —                                                           |
| DEC-005 | Pending  | Project ownership        | Single-owner projects first; design identifiers for later collaboration                  | —                                                           |
| DEC-006 | Pending  | Procedural source scope  | Synthesized sources first; allow imported samples after upload/storage safeguards        | —                                                           |
| DEC-007 | Pending  | Supported browser        | Chromium desktop first, expand from measured compatibility                               | —                                                           |
| DEC-008 | Pending  | Binary storage           | Filesystem/PVC behind a storage interface, then evaluate S3-compatible storage           | —                                                           |
| DEC-009 | Pending  | AI availability          | Optional and disabled by default until privacy/provider requirements are approved        | —                                                           |
| DEC-010 | Proposed | Future visual themes     | Build semantic tokens early; ship Studio Dark, Retro, Cyberpunk, and High Contrast later | User requested themes later; exact phase remains reviewable |

## Prototype evidence for DEC-003 and DEC-004

The first Sound Lab spike validates that one managed native `AudioContext` can
preview a versioned oscillator/envelope patch and that `OfflineAudioContext`
can render the same scheduling path to mono 44.1 kHz PCM for 16-bit WAV
encoding. This is implementation evidence, not Producer approval of the
pending format and rendering decisions. OGG, FFmpeg workers, imported samples,
and canonical server rendering remain outside this prototype.

## Decision record template

```markdown
## DEC-NNN: Title

- Status: Pending | Approved | Rejected | Superseded
- Date:
- Producer:
- Context:
- Options:
- Architect recommendation:
- Producer decision:
- Consequences:
- Follow-up tasks:
```
