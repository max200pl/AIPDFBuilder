#include <windows.h>
#include <string>
#include "sciter-x-window.hpp"

class MainWindow : public sciter::window {
public:
  MainWindow() : window(SW_MAIN | SW_ENABLE_DEBUG) {}

  SOM_PASSPORT_BEGIN(MainWindow)
  SOM_PASSPORT_END
};

#include "resources.cpp"

// Single-exe distribution: sciter.dll is embedded as an RCDATA resource
// (win-res/app.rc) instead of shipped as a sibling file. sciter-x-api.h
// hardcodes LoadLibrary(L"sciter.dll") (bare name, no path) the first time
// any Sciter*() call is made, so before that happens we extract the
// embedded bytes to a per-user cache dir and point the DLL search path at
// it via SetDllDirectory — the SDK's own bare-name LoadLibrary then
// resolves there instead of failing. Requires SKIP_MAIN (set in the
// vcxproj) so the SDK's built-in wmain — which calls
// sciter::application::start(), itself a Sciter*() call — never runs
// before this.
static bool preload_sciter_dll() {
  HMODULE self = GetModuleHandleW(NULL);
  HRSRC hRes = FindResourceW(self, L"SCITER_DLL", RT_RCDATA);
  if (!hRes)
    return false;

  HGLOBAL hData = LoadResource(self, hRes);
  DWORD size = SizeofResource(self, hRes);
  void* pData = hData ? LockResource(hData) : nullptr;
  if (!pData || !size)
    return false;

  WCHAR cacheDir[MAX_PATH] = {0};
  DWORD n = GetEnvironmentVariableW(L"LOCALAPPDATA", cacheDir, MAX_PATH);
  if (!n)
    n = GetTempPathW(MAX_PATH, cacheDir);
  if (!n)
    return false;

  std::wstring dir = std::wstring(cacheDir) + L"\\AIPDFBuilder";
  CreateDirectoryW(dir.c_str(), NULL);
  std::wstring dllPath = dir + L"\\sciter.dll";

  WIN32_FILE_ATTRIBUTE_DATA attr = {0};
  bool upToDate = GetFileAttributesExW(dllPath.c_str(), GetFileExInfoStandard, &attr)
                  && attr.nFileSizeHigh == 0 && attr.nFileSizeLow == size;

  if (!upToDate) {
    HANDLE hFile = CreateFileW(dllPath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hFile == INVALID_HANDLE_VALUE)
      return false;
    DWORD written = 0;
    BOOL ok = WriteFile(hFile, pData, size, &written, NULL);
    CloseHandle(hFile);
    if (!ok || written != size)
      return false;
  }

  SetDllDirectoryW(dir.c_str());          // makes the SDK's later bare LoadLibrary(L"sciter.dll") find it
  return LoadLibraryW(dllPath.c_str()) != NULL;  // load it now too, belt-and-suspenders
}

// In debug builds, resolve res/main.htm on disk (relative to the built exe)
// so edits are picked up without repacking resources.cpp.
static bool dev_main_htm_url(std::wstring& url) {
  WCHAR exePath[MAX_PATH] = {0};
  if (!GetModuleFileNameW(NULL, exePath, MAX_PATH))
    return false;

  WCHAR* slash = wcsrchr(exePath, L'\\');
  if (slash)
    *slash = 0;

  // exePath is builds\<Config>\ — two levels up (Config -> builds) reaches repo root.
  WCHAR relative[MAX_PATH] = {0};
  swprintf_s(relative, L"%s\\..\\..\\res\\main.htm", exePath);

  WCHAR fullPath[MAX_PATH] = {0};
  if (!GetFullPathNameW(relative, MAX_PATH, fullPath, NULL))
    return false;

  if (GetFileAttributesW(fullPath) == INVALID_FILE_ATTRIBUTES)
    return false;

  for (WCHAR* p = fullPath; *p; ++p)
    if (*p == L'\\') *p = L'/';

  url = L"file:///" + std::wstring(fullPath);
  return true;
}

int uimain(std::function<int()> run) {

  SciterSetOption(NULL, SCITER_SET_SCRIPT_RUNTIME_FEATURES,
                  ALLOW_FILE_IO |
                  ALLOW_SOCKET_IO |
                  ALLOW_EVAL |
                  ALLOW_SYSINFO);

  sciter::archive::instance().open(aux::elements_of(resources));

  sciter::om::hasset<MainWindow> pwin = new MainWindow();

  bool loaded = false;

#ifdef _DEBUG
  std::wstring devUrl;
  if (dev_main_htm_url(devUrl))
    loaded = pwin->load(devUrl.c_str());
#endif

  if (!loaded)
    loaded = pwin->load(WSTR("this://app/main.htm"));

  pwin->expand();

  return run();
}

// Replaces the SDK's built-in wmain (disabled via SKIP_MAIN) so
// preload_sciter_dll() runs before sciter::application::start() — which
// is itself a Sciter*() call and would otherwise trigger the SDK's
// unpatched LoadLibrary(L"sciter.dll") first.
int wmain(int argc, wchar_t* argv[]) {
  if (!preload_sciter_dll()) {
    MessageBoxW(NULL, L"Failed to unpack sciter.dll", L"AIPDFBuilder", MB_ICONERROR);
    return 1;
  }

  sciter::application::start(argc, (const WCHAR**)argv);
  int r = uimain([]() -> int { return sciter::application::run(); });
  sciter::application::shutdown();
  return r;
}
