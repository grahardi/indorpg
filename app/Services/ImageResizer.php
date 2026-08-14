<?php

namespace App\Services;

use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\PngEncoder;
use Intervention\Image\ImageManager;

class ImageResizer
{
    /**
     * Crop+resize an uploaded image to exact target dimensions (cover fit)
     * and return encoded PNG binary content.
     */
    public static function coverResizePng(string $sourcePath, int $width, int $height, string $position = 'center'): string
    {
        $manager = new ImageManager(new Driver());

        $image = $manager->read($sourcePath);
        $image->cover($width, $height, $position);

        return (string) $image->encode(new PngEncoder());
    }
}
