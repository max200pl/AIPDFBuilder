#include <windows.h>
#include "sciter-x-window.hpp"

class MainWindow : public sciter::window {
public:
  MainWindow() : window(SW_MAIN | SW_ENABLE_DEBUG) {}

  SOM_PASSPORT_BEGIN(MainWindow)
  SOM_PASSPORT_END
};

#include "resources.cpp"

// In debug builds, resolve res/main.htm on disk (relative to the built exe)
// so edits are picked up without repacking resources.cpp.
static bool dev_main_htm_url(std::wstring& url) {
  WCHAR exePath[MAX_PATH] = {0};
  if (!GetModuleFileNameW(NULL, exePath, MAX_PATH))
    return false;

  WCHAR* slash = wcsrchr(exePath, L'\\');
  if (slash)
    *slash = 0;

  // exePath is bin\x64\<Config>\ — three levels up (Config -> x64 -> bin) reaches repo root.
  WCHAR relative[MAX_PATH] = {0};
  swprintf_s(relative, L"%s\\..\\..\\..\\res\\main.htm", exePath);

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
