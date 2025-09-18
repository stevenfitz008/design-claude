import React, { useState } from 'react';
import { FaClone, FaTimes } from '@meronex/icons/fa';
import { PolotnoStylePagesPanel } from '../panels/PolotnoStylePagesPanel';

interface PagesButtonProps {
  className?: string;
}

export const PagesButton: React.FC<PagesButtonProps> = ({ className }) => {
  const [isPagesOpen, setIsPagesOpen] = useState(false);

  const togglePages = () => {
    setIsPagesOpen(!isPagesOpen);
  };

  return (
    <>
      {/* Pages Button */}
      <button
        onClick={togglePages}
        className={className}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 1000,
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: isPagesOpen ? '#48aff0' : '#252a30',
          border: `1px solid ${isPagesOpen ? '#48aff0' : '#495563'}`,
          color: isPagesOpen ? '#ffffff' : '#a7b6c2',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          if (!isPagesOpen) {
            e.currentTarget.style.background = 'rgba(72, 175, 240, 0.1)';
            e.currentTarget.style.borderColor = '#48aff0';
            e.currentTarget.style.color = '#48aff0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPagesOpen) {
            e.currentTarget.style.background = '#252a30';
            e.currentTarget.style.borderColor = '#495563';
            e.currentTarget.style.color = '#a7b6c2';
          }
        }}
        title={isPagesOpen ? 'Close Pages' : 'Open Pages'}
      >
        {isPagesOpen ? <FaTimes /> : <FaClone />}
      </button>

      {/* Pages Panel Overlay */}
      {isPagesOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '20px',
            width: '350px',
            height: '500px',
            maxHeight: 'calc(100vh - 120px)',
            background: '#2f343c',
            border: '1px solid #495563',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            zIndex: 999,
            overflow: 'hidden'
          }}
        >
          {/* Close button inside panel */}
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1001
          }}>
            <button
              onClick={togglePages}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: 'transparent',
                border: 'none',
                color: '#a7b6c2',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#f5f8fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#a7b6c2';
              }}
            >
              <FaTimes />
            </button>
          </div>

          <PolotnoStylePagesPanel />
        </div>
      )}

      {/* Backdrop to close panel when clicking outside */}
      {isPagesOpen && (
        <div
          onClick={togglePages}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            background: 'transparent'
          }}
        />
      )}
    </>
  );
};