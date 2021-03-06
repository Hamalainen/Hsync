import { Injectable, Output, EventEmitter, OnInit, AfterContentInit, HostListener } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { NotificationService } from './notification.service';
import { BrowserNotificationService } from './browser-notification.service';
import { SyncService } from './sync.service';
import { isFunction } from 'util';

let _window: any = window;

@Injectable()
export class YoutubePlayerService implements AfterContentInit {
  public yt_player;
  private currentVideoId: string;


  @Output() videoChangeEvent: EventEmitter<any> = new EventEmitter(true);
  @Output() videoLoadedEvent: EventEmitter<any> = new EventEmitter(true);
  // @Output() playPauseEvent: EventEmitter<any> = new EventEmitter(true);
  // @Output() currentVideoText: EventEmitter<any> = new EventEmitter(true);

  constructor(
    public notificationService: NotificationService,
    public browserNotification: BrowserNotificationService,
    private syncService: SyncService
  ) { }

  ngAfterContentInit() {
  }


  createPlayer(): void {
    let interval = setInterval(() => {
      if ((typeof _window.YT !== 'undefined') && _window.YT && _window.YT.Player) {
        this.yt_player = new _window.YT.Player('yt-player', {
          width: (window.innerWidth / 1.8),
          height: (window.innerWidth / 1.8) * 0.5625,
          playerVars: {
            iv_load_policy: '3',
            rel: '0'
          },
          events: {
            onStateChange: (ev) => {
              this.onChangeSync(ev);
            }
          }
        });
        clearInterval(interval);
      }
    }, 100);
  }

  onChangeSync(ev: any) {
    if (ev.data === 0) {
      this.videoChangeEvent.emit(true);
    }
    if (ev.data === -1) {
      this.videoLoadedEvent.emit(true);
    }

    var time = this.yt_player.getCurrentTime();
    var video = this.yt_player.getVideoData()['video_id'];

    this.syncService.playerEvent(ev, video, time);
  }

  pausePlayingVideo(time?: any): void {
    if (time != null) {
      this.yt_player.seekTo(time);
    }
    this.yt_player.pauseVideo();
  }

  playPausedVideo(time?: any): void {
    if (time != null) {
      this.yt_player.seekTo(time);
    }
    this.yt_player.playVideo();
  }

  getCurrentVideo(): string {
    if (this.yt_player !== undefined) {
      return this.yt_player.getVideoData()['video_id'];
    }
  }

  resizePlayer(definedWidth?: any) {
    var width = (window.innerWidth / 1.8);
    var height = (window.innerWidth / 1.8) * 0.5625;
    if (definedWidth) {
      width = definedWidth;
      height = definedWidth * 0.5625;
    }
    this.yt_player.setSize(width, height);
  }

  loadVideo(video: any) {
    this.yt_player.loadVideoById(video['id']);
    this.yt_player.pauseVideo();
  }

  getShuffled(index: number, max: number): number {
    if (max < 2) {
      return;
    }

    let i = Math.floor(Math.random() * max);
    return i !== index ? i : this.getShuffled(index, max);
  }

  getRealTime() {
    var video = this.yt_player.getVideoData()['video_id'];
    var time = this.yt_player.getCurrentTime();
    var state = this.yt_player.getPlayerState();
    return { time: time, video: video, state: state };
  }

}
