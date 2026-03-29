param (
    [string]$IconPath,
    [string]$CheckDefault1 = "0",
    [string]$CheckDefault2 = "0",
    [string]$CheckDefault3 = "0",
    [string]$CheckDefault4 = "0",
    [string]$CheckDefault5 = "0",
    [string]$CheckDefault6 = "0",
    [string]$CheckDefault7 = "0",
    [string]$CheckDefault8 = "0",
    [string]$CheckDefault9 = "0",
    [string]$CheckDefault10 = "0",
    [string]$Title = "",
    [string]$FileName = ""
)

$IsChecked1 = ($CheckDefault1 -eq "1")
$IsChecked2 = ($CheckDefault2 -eq "1")
$IsChecked3 = ($CheckDefault3 -eq "1")
$IsChecked4 = ($CheckDefault4 -eq "1")
$IsChecked5 = ($CheckDefault5 -eq "1")
$IsChecked6 = ($CheckDefault6 -eq "1")
$IsChecked7 = ($CheckDefault7 -eq "1")
$IsChecked8 = ($CheckDefault8 -eq "1")
$IsChecked9 = ($CheckDefault9 -eq "1")
$IsChecked10 = ($CheckDefault10 -eq "1")

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsBase
Add-Type -AssemblyName WindowsFormsIntegration

$back = Get-Content -Path "$PSScriptRoot\roundCorners.cs" -Raw
$Win32 = Add-Type -MemberDefinition $back -Name "Win32" -PassThru

[System.Windows.Forms.Application]::EnableVisualStyles()

function Get-SystemIcon {
    param([string]$path)
    if (Test-Path $path -PathType Container) {
        $shell32 = [System.Runtime.InteropServices.RuntimeEnvironment]::GetRuntimeDirectory() + "..\..\system32\shell32.dll"
        return [System.Drawing.Icon]::ExtractAssociatedIcon($shell32)
    } else {
        return [System.Drawing.Icon]::ExtractAssociatedIcon($path)
    }
}

$Icon = Join-Path $PSScriptRoot "..\..\..\..\jssc.ico"
$Icon = [System.IO.Path]::GetFullPath($Icon)
Add-Type -Path "$PSScriptRoot\process.cs"

$Form                            = New-Object system.Windows.Forms.Form
$Form.ClientSize                 = New-Object System.Drawing.Point(440,400)
$Form.text                       = $Title
$Form.TopMost                    = $false
$Form.StartPosition = "CenterScreen"
$Form.FormBorderStyle = "FixedDialog"
$Form.MaximizeBox = $false
$Form.MinimizeBox = $false
if (Test-Path $Icon) {
    [Taskbar]::SetCurrentProcessExplicitAppUserModelID("JSSC.Compress") | Out-Null
    $Form.Icon = New-Object System.Drawing.Icon($Icon)
}

$Form.Add_Paint({
    param($sender, $e)
    $rect = $sender.ClientRectangle
    $c1 = [System.Drawing.Color]::FromArgb(150, 239, 213, 255)
    $c2 = [System.Drawing.Color]::FromArgb(150, 81, 90, 218)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 135)
    $e.Graphics.FillRectangle($brush, $rect)
    $brush.Dispose()
})

$PictureBox1 = New-Object system.Windows.Forms.PictureBox
$PictureBox1.Size = New-Object System.Drawing.Size(32,32)
$PictureBox1.Location = New-Object System.Drawing.Point(10,7)
$PictureBox1.SizeMode = "Zoom"
$addImage = $true

try {
    $icon = Get-SystemIcon -path $IconPath
    $PictureBox1.Image = $icon.ToBitmap()
} catch {
    $addImage = $false
}

$CheckBox1 = New-Object system.Windows.Forms.CheckBox
$CheckBox1.Text, $CheckBox1.Location, $CheckBox1.Checked, $CheckBox1.AutoSize = "JUSTC", (New-Object System.Drawing.Point(15,81)), $IsChecked1, $true
$CheckBox2 = New-Object system.Windows.Forms.CheckBox
$CheckBox2.Text, $CheckBox2.Location, $CheckBox2.Checked, $CheckBox2.AutoSize = "Recursive Compression", (New-Object System.Drawing.Point(15,101)), $IsChecked2, $true
$CheckBox3 = New-Object system.Windows.Forms.CheckBox
$CheckBox3.Text, $CheckBox3.Location, $CheckBox3.Checked, $CheckBox3.AutoSize = "Segmentation", (New-Object System.Drawing.Point(15,121)), $IsChecked3, $true
$CheckBox4 = New-Object system.Windows.Forms.CheckBox
$CheckBox4.Text, $CheckBox4.Location, $CheckBox4.Checked, $CheckBox4.AutoSize = "Base-64 Integer Encoding", (New-Object System.Drawing.Point(15,141)), $IsChecked4, $true
$CheckBox5 = New-Object system.Windows.Forms.CheckBox
$CheckBox5.Text, $CheckBox5.Location, $CheckBox5.Checked, $CheckBox5.AutoSize = "Base-64 Packing", (New-Object System.Drawing.Point(15,161)), $IsChecked5, $true
$CheckBox6 = New-Object system.Windows.Forms.CheckBox
$CheckBox6.Text, $CheckBox6.Location, $CheckBox6.Checked, $CheckBox6.AutoSize = "Offset Encoding", (New-Object System.Drawing.Point(15,181)), $IsChecked6, $true
$CheckBox7 = New-Object system.Windows.Forms.CheckBox
$CheckBox7.Text, $CheckBox7.Location, $CheckBox7.Checked, $CheckBox7.AutoSize = "lz-string", (New-Object System.Drawing.Point(15,201)), $IsChecked7, $true

$CheckBox8 = New-Object system.Windows.Forms.CheckBox
$CheckBox8.Text, $CheckBox8.Location, $CheckBox8.Checked, $CheckBox8.AutoSize = "Checksum", (New-Object System.Drawing.Point(235,81)), $IsChecked8, $true
$CheckBox9 = New-Object system.Windows.Forms.CheckBox
$CheckBox9.Text, $CheckBox9.Location, $CheckBox9.Checked, $CheckBox9.AutoSize = "Metadata", (New-Object System.Drawing.Point(235,101)), $IsChecked9, $true
$CheckBox10= New-Object system.Windows.Forms.CheckBox
$CheckBox10.Text,$CheckBox10.Location,$CheckBox10.Checked,$CheckBox10.AutoSize= "Encrypt", (New-Object System.Drawing.Point(240,130)), $IsChecked10, $true

$Label4                          = New-Object system.Windows.Forms.Label
$Label4.text                     = "Options"
$Label4.AutoSize                 = $true
$Label4.width                    = 25
$Label4.height                   = 10
$Label4.location                 = New-Object System.Drawing.Point(10,54)
$Label4.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',12)

$Label1                          = New-Object system.Windows.Forms.Label
$Label1.text                     = $FileName
$Label1.AutoSize                 = $true
$Label1.width                    = 25
$Label1.height                   = 10
$Label1.location                 = New-Object System.Drawing.Point(52,13)
$Label1.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$Label2                          = New-Object system.Windows.Forms.Label
$Label2.text                     = "Compression ratio"
$Label2.AutoSize                 = $true
$Label2.width                    = 25
$Label2.height                   = 10
$Label2.location                 = New-Object System.Drawing.Point(10,290)
$Label2.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',12)

$Label3                          = New-Object system.Windows.Forms.Label
$Label3.text                     = "Faster"
$Label3.AutoSize                 = $true
$Label3.width                    = 25
$Label3.height                   = 10
$Label3.location                 = New-Object System.Drawing.Point(20,335)
$Label3.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$Label5                          = New-Object system.Windows.Forms.Label
$Label5.text                     = "higher compression ratio"
$Label5.text                     = "Best Compression (recommended)"
$Label5.AutoSize                 = $true
$Label5.width                    = 25
$Label5.height                   = 10
$Label5.location                 = New-Object System.Drawing.Point(206,335)
$Label5.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$Label6                          = New-Object system.Windows.Forms.Label
$Label6.text                     = "Note: Options affect the actual compression`nratio more than this slider."
$Label6.AutoSize                 = $true
$Label6.width                    = 25
$Label6.height                   = 10
$Label6.location                 = New-Object System.Drawing.Point(10,360)
$Label6.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',8,[System.Drawing.FontStyle]::Italic)

$wpfSlider = New-Object System.Windows.Controls.Slider
$wpfSlider.Minimum = 0
$wpfSlider.Maximum = 10
$wpfSlider.Width = 300
$wpfSlider.TickPlacement = "None"
$wpfSlider.Background = [System.Windows.Media.SolidColorBrush]::new(
    [System.Windows.Media.Color]::FromArgb(175, 255, 255, 255)
)
$wpfSlider.IsSelectionRangeEnabled = $true
$wpfSlider.SelectionStart = 0
$wpfSlider.SelectionEnd = 10
$wpfSlider.Value = 10
$sliderWasZero = $false
$checkboxes = @($CheckBox1, $CheckBox2, $CheckBox3, $CheckBox4, $CheckBox5, $CheckBox6, $CheckBox7)
$wpfSlider.add_ValueChanged({
    $v = $this.Value
    $this.SelectionEnd = $v
    if ($v -eq 0) {
        $script:saveIsChecked1 = $CheckBox1.Checked
        $script:saveIsChecked2 = $CheckBox2.Checked
        $script:saveIsChecked3 = $CheckBox3.Checked
        $script:saveIsChecked4 = $CheckBox4.Checked
        $script:saveIsChecked5 = $CheckBox5.Checked
        $script:saveIsChecked6 = $CheckBox6.Checked
        $script:saveIsChecked7 = $CheckBox7.Checked

        foreach ($cb in $checkboxes) {
            $cb.Checked = $false
            $cb.Enabled = $false
        }

        $script:sliderWasZero = $true
    } elseif ($script:sliderWasZero) {
        $CheckBox1.Checked = $script:saveIsChecked1
        $CheckBox2.Checked = $script:saveIsChecked2
        $CheckBox3.Checked = $script:saveIsChecked3
        $CheckBox4.Checked = $script:saveIsChecked4
        $CheckBox5.Checked = $script:saveIsChecked5
        $CheckBox6.Checked = $script:saveIsChecked6
        $CheckBox7.Checked = $script:saveIsChecked7

        foreach ($cb in $checkboxes) {
            $cb.Enabled = $true
        }

        $script:sliderWasZero = $false
    }
})
$wpfSlider.TickFrequency = 1
$wpfSlider.IsSnapToTickEnabled = $true

$elhost = New-Object System.Windows.Forms.Integration.ElementHost
$elhost.Dock = [System.Windows.Forms.DockStyle]::Fill
$elhost.Child = $wpfSlider

$Label8                          = New-Object system.Windows.Forms.Label
$Label8.text                     = "Password"
$Label8.AutoSize                 = $true
$Label8.width                    = 25
$Label8.height                   = 10
$Label8.location                 = New-Object System.Drawing.Point(240,150)
$Label8.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',10)

$InputBox = New-Object System.Windows.Forms.TextBox
$InputBox.Text = ""
$InputBox.Location = New-Object System.Drawing.Point(240, 170)
$InputBox.Width = 170
$InputBox.Font = New-Object System.Drawing.Font('Microsoft JhengHei', 10)

$Label7                          = New-Object system.Windows.Forms.Label
$Label7.text                     = "Archive options"
$Label7.AutoSize                 = $true
$Label7.width                    = 25
$Label7.height                   = 10
$Label7.location                 = New-Object System.Drawing.Point(230,54)
$Label7.Font                     = New-Object System.Drawing.Font('Microsoft JhengHei',12)

$panel = New-Object System.Windows.Forms.Panel
$panel.Location = New-Object System.Drawing.Point(20, 320)
$panel.Size = New-Object System.Drawing.Size(400, 18)
$panel.Controls.Add($elhost)

$Panel1 = New-Object system.Windows.Forms.Panel
$Panel1.height, $Panel1.width, $Panel1.location = 392, 430, (New-Object System.Drawing.Point(5,3))
$Panel1.add_HandleCreated({
    $hRgn = $Win32::CreateRoundRectRgn(0, 0, $this.Width, $this.Height, 10, 10)
    $this.Region = [System.Drawing.Region]::FromHrgn($hRgn)
})

$Panel2 = New-Object system.Windows.Forms.Panel
$Panel2.height, $Panel2.width, $Panel2.location = 80, 182, (New-Object System.Drawing.Point(235,125))
$Panel2.add_HandleCreated({
    $hRgn = $Win32::CreateRoundRectRgn(0, 0, $this.Width, $this.Height, 10, 10)
    $this.Region = [System.Drawing.Region]::FromHrgn($hRgn)
})
$Panel3 = New-Object system.Windows.Forms.Panel
$Panel3.height, $Panel3.width, $Panel3.location = 84, 186, (New-Object System.Drawing.Point(233,123))
$Panel3.add_HandleCreated({
    $hRgn = $Win32::CreateRoundRectRgn(0, 0, $this.Width, $this.Height, 12, 12)
    $this.Region = [System.Drawing.Region]::FromHrgn($hRgn)
})

function UpdateEncryption {
    $InputBox.Enabled = $CheckBox10.Checked
    if ($CheckBox10.Checked) {
        $Panel3.BackColor = [System.Drawing.Color]::FromArgb(150, 81, 90, 218)
    } else {
        $Panel3.BackColor = [System.Drawing.Color]::FromArgb(0, 239, 213, 255)
    }
}
UpdateEncryption
$CheckBox10.add_CheckedChanged({UpdateEncryption})

$Button1                         = New-Object system.Windows.Forms.Button
$Button1.text                    = "Compress"
$Button1.width                   = 90
$Button1.height                  = 30
$Button1.Anchor                  = 'right,bottom'
$Button1.location                = New-Object System.Drawing.Point(345,365)
$Button1.Font                    = New-Object System.Drawing.Font('Microsoft JhengHei',10)
$Button1.DialogResult = [Windows.Forms.DialogResult]::OK
$Button1.add_HandleCreated({
    $hRgn = $Win32::CreateRoundRectRgn(0, 0, $this.Width, $this.Height, 5, 5)
    $this.Region = [System.Drawing.Region]::FromHrgn($hRgn)
})

$Form.Controls.AddRange(@($Button1, $CheckBox1, $Label4, $Label1, $Panel1, $CheckBox2, $CheckBox3, $CheckBox4, $CheckBox5, $CheckBox6, $CheckBox7, $Label2, $panel, $Label3, $Label5, $Label6, $Label7, $CheckBox8, $CheckBox9, $CheckBox10, $InputBox, $Label8, $Panel2, $Panel3))
if ($addImage) { $Form.Controls.Add($PictureBox1) }

$Form.AcceptButton = $Button1
$Panel2.SendToBack()
$Panel3.SendToBack()
$Panel1.SendToBack()

$clr = [System.Drawing.Color]::FromArgb(175, 255, 255, 255)
foreach ($ctl in @($Panel1, $CheckBox1, $Label4, $Label1, $PictureBox1, $CheckBox2, $CheckBox3, $CheckBox4, $CheckBox5, $CheckBox6, $CheckBox7, $Label2, $Label3, $Label5, $Label6, $Label7, $CheckBox8, $CheckBox9, $Panel2, $CheckBox10, $Label8)) {
    $ctl.BackColor = $clr
}
foreach ($ctl in @($elhost, $panel)) {
    $ctl.BackColor = [System.Drawing.Color]::Transparent
}

$result = $Form.ShowDialog()
if ($result -eq "OK") {
    $output = @{
        checked1 = $CheckBox1.Checked
        checked2 = $CheckBox2.Checked
        checked3 = $CheckBox3.Checked
        checked4 = $CheckBox4.Checked
        checked5 = $CheckBox5.Checked
        checked6 = $CheckBox6.Checked
        checked7 = $CheckBox7.Checked
        checked8 = $CheckBox8.Checked
        checked9 = $CheckBox9.Checked
        checked10 = $CheckBox10.Checked
        password = $InputBox.Text
        slider = $wpfSlider.Value
    }
    Write-Output ($output | ConvertTo-Json -Compress)
}
