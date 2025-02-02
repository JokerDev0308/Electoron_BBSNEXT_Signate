$code = @'
[return: MarshalAs(UnmanagedType.Bool)]
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern bool PostMessage(uint hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
[DllImport("user32.dll", SetLastError = true)]
public static extern bool LockWorkStation();
'@;
$powerManager = Add-Type -MemberDefinition $code -Name 'PowerManager' -PassThru -Language CSharp;

# Display Off
$powerManager::PostMessage(0xffff, 0x0112, 0xf170, 2);
