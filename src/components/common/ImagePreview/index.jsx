import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '../../ui';

/**
 * ImagePreview - Componente para mostrar imagenes con zoom y galeria
 * @param {string} src - URL de la imagen
 * @param {string} alt - Texto alternativo
 * @param {number} width - Ancho de la miniatura
 * @param {number} height - Alto de la miniatura
 * @param {boolean} clickToZoom - Si permite hacer zoom al hacer click
 * @param {string} fallbackSrc - Imagen de respaldo si falla
 * @param {Array} gallery - Array de URLs para navegacion en galeria
 * @param {number} galleryIndex - Indice actual en la galeria
 */
const ImagePreview = ({
  src,
  alt = 'Imagen',
  width = 80,
  height = 80,
  clickToZoom = true,
  fallbackSrc = null,
  className = '',
  gallery = null,
  galleryIndex = 0,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const [currentIndex, setCurrentIndex] = useState(galleryIndex);

  const hasGallery = gallery && gallery.length > 1;
  const currentGallerySrc = hasGallery ? gallery[currentIndex] : imgSrc;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setError(true);
    }
  };

  const handleOpen = () => {
    if (clickToZoom && !error) {
      setCurrentIndex(galleryIndex);
      setOpen(true);
    }
  };

  const goToPrev = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  }, [gallery]);

  const goToNext = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % gallery.length);
  }, [gallery]);

  useEffect(() => {
    if (!open || !hasGallery) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasGallery, goToPrev, goToNext]);

  return (
    <>
      <div
        onClick={handleOpen}
        style={{ width, height }}
        className={`
          rounded-lg overflow-hidden relative
          ${clickToZoom && !error ? 'cursor-pointer' : ''}
          bg-gray-100 flex items-center justify-center
          border border-gray-200
          transition-all duration-200
          ${clickToZoom && !error ? 'hover:scale-[1.02] hover:shadow-lg group' : ''}
          ${className}
        `}
      >
        {loading && (
          <Spinner size="sm" />
        )}

        {error ? (
          <ImageOff size={32} className="text-gray-400" />
        ) : (
          <>
            <img
              src={imgSrc}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              className={`
                w-full h-full object-cover
                ${loading ? 'hidden' : 'block'}
              `}
            />
            {clickToZoom && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn size={28} className="text-white" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de zoom con galeria */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Flecha izquierda */}
          {hasGallery && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Contenedor de imagen con X relativa */}
          <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 p-1.5 bg-surface text-gray-700 hover:bg-red-500 hover:text-white rounded-full shadow-lg transition-colors z-10"
            >
              <X size={18} />
            </button>
            <img
              src={currentGallerySrc}
              alt={alt}
              className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Flecha derecha */}
          {hasGallery && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Indicador de posicion */}
          {hasGallery && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {gallery.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentIndex ? 'bg-surface scale-125' : 'bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ImagePreview;
