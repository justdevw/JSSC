param (
    [string]$Name = "",
    [string]$Text = "",
    [int]$Progress = 0
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

[Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object Windows.Forms.Form
$form.Text = $Name
$form.Size = New-Object Drawing.Size(400, 120)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ControlBox = $false
$form.TopMost = $true

$label = New-Object Windows.Forms.Label
$label.Text = "$Text ($Progress%)"
$label.Location = New-Object Drawing.Point(20, 15)
$label.AutoSize = $true
$label.Font = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$progressBar = New-Object Windows.Forms.ProgressBar
$progressBar.Location = New-Object Drawing.Point(20, 50)
$progressBar.Size = New-Object Drawing.Size(340, 20)
$progressBar.Minimum = 0
$progressBar.Maximum = 100
$progressBar.Value = $Progress

$form.Controls.Add($label)
$form.Controls.Add($progressBar)

$timer = New-Object Windows.Forms.Timer
$timer.Interval = 100

$timer.Add_Tick({
    while ([Console]::In.Peek() -ne -1) {
        $line = [Console]::In.ReadLine()
        if ($line -ne $null) {
            $value = [int]$line
            if ($value -ge 0 -and $value -le 100) {
                $progressBar.Value = $value
                $label.Text = "$Text ($value%)"
            }
        }
    }
})

$timer.Start()

$form.Add_Shown({ $form.Activate() })
[void]$form.Show()

[Windows.Forms.Application]::Run($form)
