export const isMobile = (): boolean => {
    return window.innerWidth <= 768;
};

export const isTablet = (): boolean => {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = (): boolean => {
    return window.innerWidth > 1024;
};

export const getResponsiveClass = (): string => {
    if (isMobile()) {
        return 'mobile';
    } else if (isTablet()) {
        return 'tablet';
    } else {
        return 'desktop';
    }
};