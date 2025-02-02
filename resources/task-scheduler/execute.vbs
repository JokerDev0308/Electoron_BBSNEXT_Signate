Option Explicit

Const vbHide = 0             'ウインドウを非表示
Const vbNormalFocus = 1      '通常のウインドウ、かつ最前面のウインドウ
Const vbMinimizedFocus = 2   '最小化、かつ最前面のウインドウ
Const vbMaximizedFocus = 3   '最大化、かつ最前面のウインドウ
Const vbNormalNoFocus = 4    '通常のウインドウ、ただし、最前面にはならない
Const vbMinimizedNoFocus = 6 '最小化、ただし、最前面にはならない

Dim objWShell
Dim batFile
Dim appName
Dim appExePath

batFile="aliveMonitoring.bat"
appName=Wscript.Arguments(0)
appExePath=Wscript.Arguments(1)

Set objWShell = CreateObject("WScript.Shell")
objWShell.Run "cmd /c" + " " + batFile + " " + appName + " """ + appExePath + """", vbHide, False
Set objWShell = Nothing
