---
"@thinkeloquent/github-sdk-clone": minor
---

1. New Progress Tracking Section

- Added comprehensive documentation of the progress tracking system
- Explained the "silent by default" approach
- Showed basic and advanced usage patterns
- Included React integration examples

2. Updated API Documentation

- Enhanced clone() method documentation with new progress options
- Updated cloneRepository() with progress callbacks
- Added progress manager imports to the API reference
- Updated batch operations to show new progress data structure

3. CLI Updates

- Added --no-progress flag documentation
- Explained how CLI progress works with the new system

4. Enhanced Examples

- Updated batch clone examples to show detailed progress data
- Enhanced advanced configuration examples with monitoring integration
- Added React component example for web integration
- Showed multiple progress consumer patterns

5. New Features Section

- Added "New in This Version" section highlighting progress capabilities
- Listed all new API additions
- Confirmed backward compatibility
- Referenced the detailed PROGRESS.md documentation

Key Features Documented:

- Silent by default: Progress is only shown when consuming apps request it
- Detailed progress data: Percentage, stages, messages, timing information
- Multiple consumers: Same progress data can feed UI, logging, analytics, monitoring
- Custom progress managers: Full control over progress handling
- Stage-based tracking: Monitor different phases of the clone operation
- Framework integration: Examples for React, Express.js, and other systems
- CLI progress bars: Optional visual progress in terminal applications
- Backward compatibility: Legacy progress callbacks continue to work
