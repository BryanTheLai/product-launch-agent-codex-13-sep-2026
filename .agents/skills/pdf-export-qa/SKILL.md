---
name: pdf-export-qa
description: Renders the editable deck and creates a matching PDF with page-count, crop, font, and integrity checks using pdf-lib.
---

# PDF Export QA

Compiles a high-resolution, vector-crisp PDF document matching the 16:9 presentation without requiring external LibreOffice or system binaries.

## Standards & Integrity Checks
- **Page Geometry**: 960 x 540 pt (exact 16:9 aspect ratio).
- **Page Count**: Exactly 7 slides matching the PPTX master.
- **Image Embeds**: High-resolution PNG embedding with aspect-ratio preservation and centering.
- **Font Standards**: Clean StandardFonts (Helvetica / Helvetica-Bold) with verified contrast ratios against dark backgrounds.
- **File Integrity**: Magic byte validation (`%PDF-`) and non-empty buffer assertions.
