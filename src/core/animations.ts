interface ElaraAnimation {
    effect: PropertyIndexedKeyframes;
    options: KeyframeAnimationOptions;
}

export function pulseWith(duration: number): ElaraAnimation {
    return {
        effect: {
            opacity: [.5, 1],
            transform: ['scale(.95)', 'scale(1)'],
        },
        options: {
            duration
        }
    };
}

export function fadeWith(duration: number, enter: boolean): ElaraAnimation {
    return {
        effect: {
            opacity: enter ? [0, 1] : [1, 0]
        },
        options: {
            duration
        }
    };
}

export function animationsReduced(): boolean {
    if(!window.matchMedia){
        console.warn('Elara:: MatchMedia not supported.');

        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default {
    pulseWith,
    fadeWith
};