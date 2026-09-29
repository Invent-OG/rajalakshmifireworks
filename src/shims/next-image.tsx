import React from 'react';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | { src: string };
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
}

export default function Image({
  src,
  alt = '',
  width,
  height,
  fill,
  priority,
  unoptimized,
  className,
  style,
  ...props
}: ImageProps) {
  const imgSrc = typeof src === 'string' ? src : src?.src || '';
  const combinedStyle: React.CSSProperties = fill
    ? { position: 'absolute', height: '100%', width: '100%', inset: 0, objectFit: 'cover', ...style }
    : style || {};

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={combinedStyle}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}
