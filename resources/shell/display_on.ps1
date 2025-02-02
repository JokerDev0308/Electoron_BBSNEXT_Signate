$code = @'
[return: MarshalAs(UnmanagedType.Bool)]
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern bool PostMessage(uint hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
[DllImport("user32.dll", SetLastError = true)]
public static extern bool LockWorkStation();
[DllImport("user32.dll",CharSet=CharSet.Auto,CallingConvention=CallingConvention.StdCall)]
public static extern void mouse_event(long dwFlags, long dx, long dy, long cButtons, long dwExtraInfo);
'@;
$powerManager = Add-Type -MemberDefinition $code -Name 'PowerManager' -PassThru -Language CSharp;
$SendMouseClick = Add-Type -memberDefinition $code -name "Win32MouseEventNew" -namespace Win32Functions -passThru

# Display On
$powerManager::PostMessage(0xffff, 0x0112, 0xf170, -1);

# Move Cursor
add-type -AssemblyName System.Windows.Forms
$mousePosition = [Windows.Forms.Cursor]::Position
$mousePosition.x = 9999
$mousePosition.y = 100
[Windows.Forms.Cursor]::Position = $mousePosition

# Press Enter Key
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
