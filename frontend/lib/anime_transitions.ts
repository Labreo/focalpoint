/**
 * Anime.js Micro-Interaction & Transition Engine for FocalPoint
 * Inspired by deltea.space's kinetic, stepped retro-cyber aesthetic
 */
import { animate, stagger } from 'animejs';

export const animeTransitions = {
  /**
   * Staggered entrance for lists, badges, and cards
   */
  staggerEntrance: (targets: any, delayStep = 60) => {
    if (typeof window === 'undefined') return;
    try {
      animate(targets, {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.97, 1],
        delay: stagger(delayStep, { start: 100 }),
        duration: 450,
        ease: 'outExpo'
      });
    } catch {}
  },

  /**
   * Smooth elastic dwell progress animation for Gaze locks
   */
  animateDwellProgress: (target: any, progress: number) => {
    if (typeof window === 'undefined') return;
    try {
      animate(target, {
        strokeDashoffset: (1 - progress) * 283,
        duration: 120,
        ease: 'linear'
      });
    } catch {}
  },

  /**
   * Snappy elastic drawer pop-out for Atkinson Hyperlegible text reflow
   */
  animateDrawerEntrance: (target: any) => {
    if (typeof window === 'undefined') return;
    try {
      animate(target, {
        translateY: [60, 0],
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 400,
        ease: 'outBack'
      });
    } catch {}
  },

  /**
   * Reactive badge bounce on keyboard shortcut or state toggle
   */
  pulseBadge: (target: any) => {
    if (typeof window === 'undefined') return;
    try {
      animate(target, {
        scale: [1, 1.12, 1],
        duration: 220,
        ease: 'outQuad'
      });
    } catch {}
  },

  /**
   * Stepped CRT phosphor flicker on scene change or fixation lock
   */
  flickerElement: (target: any) => {
    if (typeof window === 'undefined') return;
    try {
      animate(target, {
        opacity: [1, 0.2, 1, 0.5, 1],
        duration: 250,
        ease: 'steps(4)'
      });
    } catch {}
  }
};
