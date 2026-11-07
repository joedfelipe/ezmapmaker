# EzMapMaker

**A modern desktop interface for the original MAPMAKER/EXP 3.0b.**

Developed with AI-assisted implementation.

EzMapMaker keeps MapMaker's typed-command workflow and adds selectable scrollback, a resizable window, project-folder selection, command history, light/dark themes, and a built-in guide and citation. It runs the original DOS executable through a bundled js-dos/DOSBox engine.

## Download

Get a platform-specific ZIP from [GitHub Releases](https://github.com/joedfelipe/ezmapmaker/releases). Release downloads will appear there once published. GitHub's automatic “Source code” archives are developer downloads, not runnable apps.

- **Apple Silicon Mac:** choose `mac-arm64`, unzip, and move `EzMapMaker.app` to Applications.
- **Intel Mac:** choose `mac-x64` and follow the same steps.
- **Windows 64-bit:** extract the complete `windows-x64` ZIP and open `EzMapMaker.exe`. Keep its accompanying folders together.

Standalone packages include the runtime and engine: users do not need Node.js, DOSBox, or an internet connection. Local Mac builds are ad-hoc signed, not notarized; Windows builds are unsigned. On Mac, use the system's **Privacy & Security → Open Anyway** option if blocked. Windows may show SmartScreen. Only open packages from a trusted source.


## Use

1. Put your `.RAW` file in a project folder. Use a DOS 8.3 filename, for example `MYDATA.RAW`; the host folder path can contain spaces.
2. Click **Open project folder** and select that folder.
3. Enter `prepare mydata.raw` and press Enter. Continue with your laboratory instructions; use `help` for MapMaker commands.
4. Files written by MapMaker are copied into the same project folder, including `.PS` files after drawing commands create them.
5. Type `quit` and answer MapMaker's save prompt to save analysis still in memory.

Scroll to review output and select text to copy. Up/down recall commands. Cmd/Ctrl plus/minus adjusts text size. **About** contains the guide, credits and a copyable citation.

The folder is imported at session start. If you add files later, quit and reopen it. Avoid simultaneous edits in another app or another session. File deletions in DOS are not propagated. Only DOS-compatible regular filenames are imported; hidden files, subdirectories and symbolic links are skipped. Files written by MapMaker are synchronized approximately every 1.2 seconds and on normal exit.


## Citation

> Felipe, J. E. L. (2026). *EzMapMaker* (Version 0.2.1) [Computer software]. https://github.com/joedfelipe/ezmapmaker

Cite the original MAPMAKER publication as well when reporting genetic analyses. MapMaker source reference: [kentavv/mapmaker](https://github.com/kentavv/mapmaker). The bundled engine remains the original DOS release.

## Licenses and credits

EzMapMaker wrapper/build code is distributed under **GPL-2.0-only**; see [LICENSE](LICENSE). This does not relicense third-party components or claim their authorship.

- **Original MAPMAKER/EXP:** Whitehead Institute for Biomedical Research; its separate terms are reproduced in [licenses/MAPMAKER-LICENSE.txt](licenses/MAPMAKER-LICENSE.txt). Preserve the complete original package and notices when redistributing it.
- **js-dos/DOSBox:** GPL v2. The emulator version is pinned to `emulators` 8.5.2. Matching source archives and the console-adapter generator accompany standalone builds.
- **Electron:** MIT and its bundled third-party notices.

See [distribution/THIRD-PARTY-NOTICES.txt](distribution/THIRD-PARTY-NOTICES.txt) for exact upstream references. Source archives are generated locally; none containing local datasets are committed. The earlier native-port experiment is not part of this repository or the shipped engine.
