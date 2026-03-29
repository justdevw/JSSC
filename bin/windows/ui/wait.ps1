param (
    [string]$Name = "",
    [string]$Text = "",
    [int]$Progress = 0
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsFormsIntegration

[Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object Windows.Forms.Form
$form.Text = $Name
$form.Size = New-Object Drawing.Size(400, 100)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ControlBox = $false
$form.TopMost = $true

$Icon = Join-Path $PSScriptRoot "..\..\..\..\jssc.ico"
$Icon = [System.IO.Path]::GetFullPath($Icon)
Add-Type -Path "$PSScriptRoot\process.cs"
if (Test-Path $Icon) {
    [Taskbar]::SetCurrentProcessExplicitAppUserModelID("JSSC.Compress") | Out-Null
    $form.Icon = New-Object System.Drawing.Icon($Icon)
}

$label = New-Object Windows.Forms.Label
$label.Text = "$Text ($Progress%)"
$label.Location = New-Object Drawing.Point(20, 5)
$label.AutoSize = $true
$label.Font = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$wpfProgress = New-Object System.Windows.Controls.ProgressBar
$wpfProgress.Minimum = 0
$wpfProgress.Maximum = 100
$wpfProgress.Value = $Progress
$wpfProgress.Height = 20
$wpfProgress.Width = 340
$wpfProgress.Margin = '0'
$wpfProgress.Resources["ProgressBarCornerRadius"] = 10
$wpfProgress.IsIndeterminate = $true
$wpfProgress.Foreground = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromArgb(150, 81, 90, 218)
)
$wpfProgress.Background = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromArgb(150, 239, 213, 255)
)

$form.Controls.Add($label)

$elhost = New-Object System.Windows.Forms.Integration.ElementHost
$elhost.Location = New-Object Drawing.Point(20, 30)
$elhost.Size = New-Object Drawing.Size(340, 20)
$elhost.Child = $wpfProgress
$elhost.BackColor = [System.Drawing.Color]::Transparent

$form.Controls.Add($elhost)

$timer = New-Object Windows.Forms.Timer
$timer.Interval = 100

$idleTicks = 0
function Idle {
    $idleTicks++
    $timeout = New-Object Windows.Forms.Timer
    $timeout.Interval = 3000
    $timeout.Add_Tick({
        if ($idleTicks -ge 0) {
            $wpfProgress.IsIndeterminate = $true
        } else {
            $timeout.Stop()
        }
    })
    $timeout.Start()
}

$timer.Add_Tick({
    Idle
    $line = [Console]::In.ReadLine()
    $newValue = [int]$line
    if ($newValue -ne $wpfProgress.Value) {
        $idleTicks = 0
        $wpfProgress.Value = $newValue
        $wpfProgress.IsIndeterminate = $false
        $label.Text = "$Text ($newValue%)"
    }
})

$timer.Start()

$form.Add_Shown({ $form.Activate() })
[void]$form.Show()

[Windows.Forms.Application]::Run($form)
