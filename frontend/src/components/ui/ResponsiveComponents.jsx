import React, { memo } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * RESPONSIVE PAGE WRAPPER
 * Standardizes the main content area with safe padding for PWA mode.
 */
export const ResponsivePage = memo(({ children, className = '' }) => (
  <main className={`flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-x-hidden min-h-screen pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] ${className}`}>
    {children}
  </main>
));
ResponsivePage.displayName = 'ResponsivePage';

/**
 * PAGE HEADER
 * Standardized responsive page headers with optional actions.
 */
export const PageHeader = memo(({ title, description, actions }) => (
  <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
    <div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
  </header>
));
PageHeader.displayName = 'PageHeader';

/**
 * RESPONSIVE CARD
 * Standardizes card padding and border radius across mobile and desktop.
 */
export const ResponsiveCard = memo(({ children, className = '', noPadding = false }) => (
  <div className={`bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden ${noPadding ? '' : 'p-4 sm:p-6'} ${className}`}>
    {children}
  </div>
));
ResponsiveCard.displayName = 'ResponsiveCard';

/**
 * KPI GRID
 * Auto-adjusts columns from 1 on mobile to 2/4 on larger screens.
 */
export const KPIGrid = memo(({ children, className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
    {children}
  </div>
));
KPIGrid.displayName = 'KPIGrid';

/**
 * RESPONSIVE TABLE WRAPPER
 * CRITICAL FIX: Wraps existing tables to prevent full-page horizontal scroll on mobile.
 */
export const ResponsiveTableWrapper = memo(({ children, className = '' }) => (
  <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <div className="min-w-[800px] w-full">
      {children}
    </div>
  </div>
));
ResponsiveTableWrapper.displayName = 'ResponsiveTableWrapper';

/**
 * RESPONSIVE MODAL
 * Standardizes modal width, height constraints, and safe area spacing.
 */
export const ResponsiveModal = memo(({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" aria-modal="true" role="dialog">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden animate-modal-enter`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors focus:ring-2 focus:ring-indigo-500 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
});
ResponsiveModal.displayName = 'ResponsiveModal';

/**
 * EMPTY STATE
 * Premium empty state to replace "No Data" text.
 * Supports icon, title, description, and optional primary/secondary actions.
 */
export const EmptyState = memo(({ title, description, icon: Icon = AlertCircle, primaryAction, secondaryAction }) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 w-full min-w-0">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 sm:mb-6 shrink-0">
      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 truncate max-w-full px-4">{title}</h3>
    {description && <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto mb-6 px-4 break-words">{description}</p>}
    {(primaryAction || secondaryAction) && (
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto px-4">
        {secondaryAction && <div className="w-full sm:w-auto">{secondaryAction}</div>}
        {primaryAction && <div className="w-full sm:w-auto">{primaryAction}</div>}
      </div>
    )}
  </div>
));
EmptyState.displayName = 'EmptyState';

/**
 * FILTER TOOLBAR
 * Responsive container for search inputs and filter dropdowns.
 */
export const FilterToolbar = memo(({ children, className = '' }) => (
  <div className={`bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center justify-between sticky top-2 z-[40] min-w-0 w-full ${className}`}>
    {children}
  </div>
));
FilterToolbar.displayName = 'FilterToolbar';

/**
 * SKELETON LOADER
 * Provides specific variants: 'kpi', 'chart', 'table', 'list', 'generic'
 */
export const SkeletonLoader = memo(({ variant = 'generic', className = '', count = 1 }) => {
  const skeletons = Array.from({ length: count }).map((_, idx) => {
    switch (variant) {
      case 'kpi':
        return (
          <div key={idx} className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4 animate-pulse min-w-0 ${className}`}>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-slate-200 rounded-2xl shrink-0" />
              <div className="w-20 h-6 bg-slate-200 rounded-full shrink-0" />
            </div>
            <div className="w-1/2 h-8 bg-slate-200 rounded-lg mt-2" />
            <div className="w-3/4 h-4 bg-slate-200 rounded mt-1" />
          </div>
        );
      case 'chart':
        return (
          <div key={idx} className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm animate-pulse flex flex-col min-w-0 ${className}`}>
            <div className="w-1/3 h-6 bg-slate-200 rounded mb-2" />
            <div className="w-1/4 h-4 bg-slate-200 rounded mb-6" />
            <div className="h-56 sm:h-64 w-full bg-slate-100 rounded-2xl mt-2 flex items-end gap-2 p-4 justify-around">
              <div className="w-1/6 bg-slate-200 rounded-t-sm h-[40%]" />
              <div className="w-1/6 bg-slate-200 rounded-t-sm h-[70%]" />
              <div className="w-1/6 bg-slate-200 rounded-t-sm h-[50%]" />
              <div className="w-1/6 bg-slate-200 rounded-t-sm h-[90%]" />
              <div className="w-1/6 bg-slate-200 rounded-t-sm h-[30%]" />
            </div>
          </div>
        );
      case 'table':
        return (
          <div key={idx} className={`bg-white rounded-xl border border-slate-200 shadow-sm w-full overflow-hidden min-w-0 animate-pulse ${className}`}>
            <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center px-6 gap-4">
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
              <div className="w-1/4 h-4 bg-slate-200 rounded" />
            </div>
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="h-16 border-b border-slate-100 flex items-center px-6 gap-4">
                <div className="w-1/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/4 h-4 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        );
      case 'list':
        return (
          <div key={idx} className={`flex flex-col gap-4 animate-pulse min-w-0 ${className}`}>
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/3 h-4 bg-slate-200 rounded" />
                  <div className="w-1/2 h-3 bg-slate-200 rounded" />
                </div>
                <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        );
      case 'generic':
      default:
        return (
          <div key={idx} className={`animate-pulse bg-slate-200 rounded-xl ${className}`} aria-hidden="true" />
        );
    }
  });

  return <>{skeletons}</>;
});
SkeletonLoader.displayName = 'SkeletonLoader';
