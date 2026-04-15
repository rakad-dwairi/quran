$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Add-Type -AssemblyName System.Drawing

function Get-ColorFromHex {
  param([Parameter(Mandatory = $true)][string]$Hex)
  $hex = $Hex.Trim().TrimStart("#")
  if ($hex.Length -eq 6) {
    $r = [Convert]::ToInt32($hex.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($hex.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($hex.Substring(4, 2), 16)
    return [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
  }
  if ($hex.Length -eq 8) {
    $a = [Convert]::ToInt32($hex.Substring(0, 2), 16)
    $r = [Convert]::ToInt32($hex.Substring(2, 2), 16)
    $g = [Convert]::ToInt32($hex.Substring(4, 2), 16)
    $b = [Convert]::ToInt32($hex.Substring(6, 2), 16)
    return [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
  }
  throw "Invalid hex color: $Hex"
}

function New-PointF {
  param([float]$X, [float]$Y)
  return New-Object System.Drawing.PointF($X, $Y)
}

function New-RectF {
  param([float]$X, [float]$Y, [float]$W, [float]$H)
  return New-Object System.Drawing.RectangleF($X, $Y, $W, $H)
}

function Get-StarPoints {
  param(
    [Parameter(Mandatory = $true)][float]$CenterX,
    [Parameter(Mandatory = $true)][float]$CenterY,
    [Parameter(Mandatory = $true)][int]$Spikes,
    [Parameter(Mandatory = $true)][float]$OuterRadius,
    [Parameter(Mandatory = $true)][float]$InnerRadius
  )

  $points = New-Object System.Drawing.PointF[] (2 * $Spikes)
  $step = [Math]::PI / $Spikes
  $angle = -[Math]::PI / 2

  for ($i = 0; $i -lt (2 * $Spikes); $i++) {
    $r = if (($i % 2) -eq 0) { $OuterRadius } else { $InnerRadius }
    $x = $CenterX + ($r * [Math]::Cos($angle))
    $y = $CenterY + ($r * [Math]::Sin($angle))
    $points[$i] = New-PointF -X ([float]$x) -Y ([float]$y)
    $angle += $step
  }

  return $points
}

function Draw-LogoMark {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
    [Parameter(Mandatory = $true)][int]$Size,
    [Parameter(Mandatory = $true)][System.Drawing.Brush]$Brush
  )

  # Crescent (even-odd fill of two circles)
  $outerR = [float]($Size * 0.30)
  $innerR = [float]($Size * 0.24)

  $cx = [float]($Size * 0.46)
  $cy = [float]($Size * 0.52)

  $innerCx = [float]($cx + ($Size * 0.11))
  $innerCy = $cy

  $outerRect = New-RectF -X ($cx - $outerR) -Y ($cy - $outerR) -W (2 * $outerR) -H (2 * $outerR)
  $innerRect = New-RectF -X ($innerCx - $innerR) -Y ($innerCy - $innerR) -W (2 * $innerR) -H (2 * $innerR)

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.FillMode = [System.Drawing.Drawing2D.FillMode]::Alternate
  $path.AddEllipse($outerRect)
  $path.AddEllipse($innerRect)
  $Graphics.FillPath($Brush, $path)
  $path.Dispose()

  # Starburst
  $starCx = [float]($Size * 0.63)
  $starCy = [float]($Size * 0.52)
  $spikes = 12
  $outer = [float]($Size * 0.20)
  $inner = [float]($Size * 0.09)
  $star = Get-StarPoints -CenterX $starCx -CenterY $starCy -Spikes $spikes -OuterRadius $outer -InnerRadius $inner
  $Graphics.FillPolygon($Brush, $star)
}

function Save-Png {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$Bitmap,
    [Parameter(Mandatory = $true)][string]$Path
  )
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $repoRoot "assets"

$logoDark = Get-ColorFromHex "#0F241D"
$gold1 = Get-ColorFromHex "#D9B36B"
$gold2 = Get-ColorFromHex "#E6C47D"
$splashBg = Get-ColorFromHex "#FAF8F5"

function New-Graphics {
  param([System.Drawing.Bitmap]$Bitmap)
  $g = [System.Drawing.Graphics]::FromImage($Bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return $g
}

# 1) App icon (square, branded background)
$iconSize = 1024
$icon = New-Object System.Drawing.Bitmap($iconSize, $iconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = New-Graphics -Bitmap $icon
try {
  $rect = New-RectF -X 0 -Y 0 -W $iconSize -H $iconSize
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $gold1, $gold2, 45)
  $g.FillRectangle($bg, $rect)
  $bg.Dispose()

  $brush = New-Object System.Drawing.SolidBrush($logoDark)
  Draw-LogoMark -Graphics $g -Size $iconSize -Brush $brush
  $brush.Dispose()
} finally {
  $g.Dispose()
}
Save-Png -Bitmap $icon -Path (Join-Path $assetsDir "icon.png")
$icon.Dispose()

# 2) Logo mark (transparent)
$markSize = 1024
$mark = New-Object System.Drawing.Bitmap($markSize, $markSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = New-Graphics -Bitmap $mark
try {
  $g.Clear([System.Drawing.Color]::Transparent)
  $brush = New-Object System.Drawing.SolidBrush($logoDark)
  Draw-LogoMark -Graphics $g -Size $markSize -Brush $brush
  $brush.Dispose()
} finally {
  $g.Dispose()
}
Save-Png -Bitmap $mark -Path (Join-Path $assetsDir "logo-mark.png")
$mark.Dispose()

# 3) Android adaptive icon foreground (transparent)
$adaptive = New-Object System.Drawing.Bitmap($markSize, $markSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = New-Graphics -Bitmap $adaptive
try {
  $g.Clear([System.Drawing.Color]::Transparent)
  $brush = New-Object System.Drawing.SolidBrush($logoDark)
  Draw-LogoMark -Graphics $g -Size $markSize -Brush $brush
  $brush.Dispose()
} finally {
  $g.Dispose()
}
Save-Png -Bitmap $adaptive -Path (Join-Path $assetsDir "adaptive-icon.png")
$adaptive.Dispose()

# 4) Splash image (centered mark on app background)
$splashSize = 2000
$splash = New-Object System.Drawing.Bitmap($splashSize, $splashSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = New-Graphics -Bitmap $splash
try {
  $g.Clear($splashBg)

  $brush = New-Object System.Drawing.SolidBrush($logoDark)
  # Draw a slightly smaller mark centered
  $g.TranslateTransform([float]($splashSize * 0.0), [float]($splashSize * 0.0))
  $scale = [float]($splashSize / 1024.0 * 0.62)
  $g.ScaleTransform($scale, $scale)
  $g.TranslateTransform([float](($splashSize / $scale - 1024) / 2), [float](($splashSize / $scale - 1024) / 2))
  Draw-LogoMark -Graphics $g -Size 1024 -Brush $brush
  $brush.Dispose()
} finally {
  $g.Dispose()
}
Save-Png -Bitmap $splash -Path (Join-Path $assetsDir "splash.png")
$splash.Dispose()

# 5) Web favicon (small)
$favSize = 48
$fav = New-Object System.Drawing.Bitmap($favSize, $favSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = New-Graphics -Bitmap $fav
try {
  $rect = New-RectF -X 0 -Y 0 -W $favSize -H $favSize
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $gold1, $gold2, 45)
  $g.FillRectangle($bg, $rect)
  $bg.Dispose()

  $brush = New-Object System.Drawing.SolidBrush($logoDark)
  Draw-LogoMark -Graphics $g -Size $favSize -Brush $brush
  $brush.Dispose()
} finally {
  $g.Dispose()
}
Save-Png -Bitmap $fav -Path (Join-Path $assetsDir "favicon.png")
$fav.Dispose()

Write-Host "Generated logo assets in $assetsDir"

