import React, { useState, useEffect } from 'react';

export const getRobustImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('/api/drive-image/')) return url;
  const driveMatch = url.match(/(?:id=|\/d\/)([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `/api/drive-image/${driveMatch[1]}`;
  }
  return url;
};

interface AlumniAvatarProps {
  photoUrl?: string;
  name: string;
  sizeClass?: string;
  textClass?: string;
}

export const AlumniAvatar: React.FC<AlumniAvatarProps> = ({
  photoUrl,
  name,
  sizeClass = "w-16 h-16 rounded-2xl",
  textClass = "text-xl font-black"
}) => {
  const initials = name ? name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'A';
  const [imgSrc, setImgSrc] = useState<string>(() => getRobustImageUrl(photoUrl));
  const [hasError, setHasError] = useState<boolean>(false);
  const fileIdMatch = photoUrl?.match(/(?:id=|\/d\/)([\w-]+)/);
  const fileId = fileIdMatch ? fileIdMatch[1] : null;

  useEffect(() => {
    setImgSrc(getRobustImageUrl(photoUrl));
    setHasError(false);
  }, [photoUrl]);

  const handleError = () => {
    if (fileId) {
      if (imgSrc.startsWith('/api/drive-image/')) {
        setImgSrc(`https://lh3.googleusercontent.com/d/${fileId}=s0`);
      } else if (imgSrc.includes('lh3.googleusercontent.com')) {
        setImgSrc(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`);
      } else if (imgSrc.includes('drive.google.com/thumbnail')) {
        setImgSrc(`https://drive.google.com/uc?export=view&id=${fileId}`);
      } else {
        setHasError(true);
      }
    } else {
      setHasError(true);
    }
  };

  return (
    <div className={`${sizeClass} bg-[#f0f4f8] text-[#002147] border border-slate-200/90 flex items-center justify-center shrink-0 overflow-hidden relative uppercase shadow-2xs`}>
      {!hasError && photoUrl ? (
        <img
          src={imgSrc}
          alt={name}
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          className="w-full h-full object-cover object-center rounded-[inherit] transition-opacity duration-300 transform-gpu"
          style={{ imageRendering: 'auto' }}
          onError={handleError}
        />
      ) : (
        <span className={`${textClass} text-[#002147] font-black`}>{initials}</span>
      )}
    </div>
  );
};
