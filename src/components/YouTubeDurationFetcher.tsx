import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiPromise: Promise<any> | null = null;

const loadYoutubeApi = () => {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
      
      const oldCb = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (oldCb) oldCb();
        resolve(window.YT);
      };
    });
  }
  return apiPromise;
};

interface Props {
  videoId: string;
  onDurationFetched: (duration: number) => void;
}

export function YouTubeDurationFetcher({ videoId, onDurationFetched }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    loadYoutubeApi().then((YT) => {
      if (!isMounted || !containerRef.current) return;
      
      const div = document.createElement('div');
      containerRef.current.appendChild(div);
      
      playerRef.current = new YT.Player(div, {
        height: '10',
        width: '10',
        videoId: videoId,
        playerVars: {
           autoplay: 0,
           controls: 0,
           showinfo: 0,
           rel: 0
        },
        events: {
          'onReady': (event: any) => {
            if (!isMounted) return;
            const duration = event.target.getDuration();
            if (duration > 0) {
              onDurationFetched(duration);
            }
          },
          'onError': (event: any) => {
            console.error("YouTube Player Error", event.data);
            // Ignore errors
          }
        }
      });
    });

    return () => {
      isMounted = false;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onDurationFetched]);

  return <div ref={containerRef} style={{ display: 'none' }} />;
}
