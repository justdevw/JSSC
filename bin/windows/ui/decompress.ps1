param (
    [string]$Name = "",
    [string]$Text = ""
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsFormsIntegration

$back = Get-Content -Path "$PSScriptRoot\roundCorners.cs" -Raw
$Win32 = Add-Type -MemberDefinition $back -Name "Win32" -PassThru

[Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object Windows.Forms.Form
$form.Text = $Name
$form.Size = New-Object Drawing.Size(400, 140)
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
    [Taskbar]::SetCurrentProcessExplicitAppUserModelID("JSSC.Decompress") | Out-Null
    $form.Icon = New-Object System.Drawing.Icon($Icon)
}

$label = New-Object Windows.Forms.Label
$label.Text = "$Text"
$label.Location = New-Object Drawing.Point(20, 5)
$label.AutoSize = $true
$label.Font = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$InputBox = New-Object System.Windows.Forms.TextBox
$InputBox.Text = ""
$InputBox.Location = New-Object System.Drawing.Point(20, 30)
$InputBox.Width = 340
$InputBox.Font = New-Object System.Drawing.Font('Microsoft JhengHei', 10)

$Button1                         = New-Object system.Windows.Forms.Button
$Button1.text                    = "Decompress"
$Button1.width                   = 340
$Button1.height                  = 30
$Button1.Anchor                  = 'right,bottom'
$Button1.location                = New-Object System.Drawing.Point(20,65)
$Button1.Font                    = New-Object System.Drawing.Font('Microsoft JhengHei',10)
$Button1.DialogResult = [Windows.Forms.DialogResult]::OK
$Button1.add_HandleCreated({
    $hRgn = $Win32::CreateRoundRectRgn(0, 0, $this.Width, $this.Height, 5, 5)
    $this.Region = [System.Drawing.Region]::FromHrgn($hRgn)
})

$form.Controls.AddRange(@($label, $InputBox, $Button1))

$result = $Form.ShowDialog()
if ($result -eq "OK") {
    $output = @{
        password = $InputBox.Text
    }
    Write-Output ($output | ConvertTo-Json -Compress)
}
