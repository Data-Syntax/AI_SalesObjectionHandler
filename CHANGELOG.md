# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Rearchitected the main application layout to a responsive three-column design using CSS Grid.
- Moved the "Objection Handling Framework" to a dedicated left sidebar for easy reference.
- Moved the "Try an Example" and "Your Sales Playbook" sections to a new right sidebar to group actions together.
- The central column is now focused on the primary user interaction: entering an objection and viewing the AI-generated response.
- Updated `README.md` to begin tracking Lines of Code, reflecting an increase from a previous estimate of ~950 to the current ~1030.
- Recalculated Lines of Code in `README.md` from ~1030 to ~1150 to reflect the current, accurate project size.

## [1.0.0] - 2024-01-01

### Added
- Initial version of the Sales Objection Handler application.
- AI-powered rebuttals using the Google Gemini API.
- Custom context via document upload (.pdf, .doc, .docx).
- Structured 3-step response framework (Acknowledge, Pivot, Solve).
- In-memory caching for performance optimization.
- Streaming responses for a real-time user experience.