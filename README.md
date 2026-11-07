# EzMapMaker

**A modern desktop interface for the original MAPMAKER/EXP 3.0b.**

Developed by **John Edward L. Felipe**, with AI-assisted implementation.

EzMapMaker keeps MapMaker's typed-command workflow and adds selectable scrollback, a resizable window, project-folder selection, command history, light/dark themes, and a built-in guide and citation. It runs the original DOS executable through a bundled js-dos/DOSBox engine.

## Download

Get a platform-specific ZIP from [GitHub Releases](https://github.com/joedfelipe/ezmapmaker/releases). Release downloads will appear there once published. GitHub's automatic “Source code” archives are developer downloads, not runnable apps.

- **Apple Silicon Mac:** choose `mac-arm64`, unzip, and move `EzMapMaker.app` to Applications.
- **Intel Mac:** choose `mac-x64` and follow the same steps.
- **Windows 64-bit:** extract the complete `windows-x64` ZIP and open `EzMapMaker.exe`. Keep its accompanying folders together.

Standalone packages include the runtime and engine: users do not need Node.js, DOSBox, or an internet connection. Local Mac builds are ad-hoc signed, not notarized; Windows builds are unsigned. On Mac, use the system's **Privacy & Security → Open Anyway** option if blocked. Windows may show SmartScreen. Only open packages from a trusted source.

Version **0.2.1** was tested on Apple Silicon and under Rosetta for Intel Mac. Windows was cross-built and inspected but has not yet been launch-tested on Windows.

## Use

1. Put your `.RAW` file in a project folder. Use a DOS 8.3 filename, for example `MYDATA.RAW`; the host folder path can contain spaces.
2. Click **Open project folder** and select that folder.
3. Enter `prepare mydata.raw` and press Enter. Continue with your laboratory instructions; use `help` for MapMaker commands.
4. Files written by MapMaker are copied into the same project folder, including `.PS` files after drawing commands create them.
5. Type `quit` and answer MapMaker's save prompt to save analysis still in memory.

Scroll to review output and select text to copy. Up/down recall commands. Cmd/Ctrl plus/minus adjusts text size. **About** contains the guide, credits and a copyable citation.

The folder is imported at session start. If you add files later, quit and reopen it. Avoid simultaneous edits in another app or another session. File deletions in DOS are not propagated. Only DOS-compatible regular filenames are imported; hidden files, subdirectories and symbolic links are skipped. Files written by MapMaker are synchronized approximately every 1.2 seconds and on normal exit.

## Develop locally

Use Node.js 22 or newer and npm. Clone the repository, then:

```sh
npm ci
npm start
```

`npm ci` prepares the pinned emulator bridge locally. The UI can open without a MapMaker package; starting a mapping session requires the original engine below.

### Supply the original engine

The original MapMaker runtime, personal/course datasets, generated binaries and old installers are intentionally **not tracked in Git**. Obtain a licensed copy of the original distribution, or extract the complete `app/mapmaker` folder from a standalone EzMapMaker release:

- Mac app: `EzMapMaker.app/Contents/Resources/app/mapmaker`
- Windows package: `resources/app/mapmaker`

Place the complete folder at `mapmaker/` beside this README. Keep its original files and notices. Do not substitute a build from another MapMaker source repository: this interface uses the original DOS release.

The runtime requires `MAPMBIN.EXE`, `DOS4GW.EXE`, `MAPMAKER.BAT`, `MAPM.VMC`, and `MAPMAKER.HLP`. Packaging requires the complete original distribution to preserve its redistribution terms.

Expected original `MAPMBIN.EXE` SHA-256:

```text
96c2067ee0df1f54d8526c99d543aad5eddfe5904614ada80040b3f489feea39
```

The local `mapmaker/` folder is ignored by Git. Never add your students' datasets or generated analysis outputs to the repository.

### Verify

```sh
npm test
node scripts/preview.cjs --test
```

Tests generate artificial F2 genotypes; no research or course dataset is committed. Engine tests report an explicit skip if the local original runtime is absent. With the engine present, they check identity, prompts, help, grouping, saving and reloading. The Electron test also checks scrollback, themes, inline input and project persistence. Screenshots go to ignored `artifacts/`.

### Build standalone packages

On a Mac:

```sh
npm run package:all
```

Or build separately:

```sh
npm run package:mac
npm run package:windows
```

The build first refreshes the corresponding wrapper source archive and downloads the exact pinned emulator/DOSBox source archives with SHA-256 verification. It then packages the original engine, runtime dependencies, instructions and notices. Outputs go to ignored `release/`. A Mac is required for Mac packaging; Windows ZIPs can be cross-built on Mac or built on Windows. Signing/notarization needs separate credentials.

## Publishing updates

1. Edit and test the source; bump the version using `npm version X.Y.Z --no-git-tag-version`.
2. Run `npm test` and the appropriate package scripts. Inspect and test the resulting packages on their target systems.
3. Commit and push the matching source changes.
4. Create a GitHub Release tagged `vX.Y.Z` at that commit. Attach the platform ZIPs, instructions and checksums as release assets, not ordinary Git files.

Updates are manual: users download the new package and replace the app, keeping their separate project folders. There is no automatic updater.

## Citation

> Felipe, J. E. L. (2026). *EzMapMaker* (Version 0.2.1) [Computer software]. https://github.com/joedfelipe/ezmapmaker

Cite the original MAPMAKER publication as well when reporting genetic analyses. MapMaker source reference: [kentavv/mapmaker](https://github.com/kentavv/mapmaker). The bundled engine remains the original DOS release.

## Licenses and credits

EzMapMaker wrapper/build code is distributed under **GPL-2.0-only**; see [LICENSE](LICENSE). This does not relicense third-party components or claim their authorship.

- **Original MAPMAKER/EXP:** Whitehead Institute for Biomedical Research; its separate terms are reproduced in [licenses/MAPMAKER-LICENSE.txt](licenses/MAPMAKER-LICENSE.txt). Preserve the complete original package and notices when redistributing it.
- **js-dos/DOSBox:** GPL v2. The emulator version is pinned to `emulators` 8.5.2. Matching source archives and the console-adapter generator accompany standalone builds.
- **Electron:** MIT and its bundled third-party notices.

See [distribution/THIRD-PARTY-NOTICES.txt](distribution/THIRD-PARTY-NOTICES.txt) for exact upstream references. Source archives are generated locally; none containing local datasets are committed. The earlier native-port experiment is not part of this repository or the shipped engine.
