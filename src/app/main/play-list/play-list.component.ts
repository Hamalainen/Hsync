import { Component, Input, OnInit, OnChanges, AfterViewChecked } from '@angular/core';
import { YoutubePlayerService } from '../../shared/services/youtube-player.service';
import { PlaylistStoreService } from '../../shared/services/playlist-store.service';
import { identifierModuleUrl } from '@angular/compiler';
import { constructDependencies } from '@angular/core/src/di/reflective_provider';
import { Subscription } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { startWith } from 'rxjs/operators';
import { PlayList } from 'src/app/shared/models/playlist';
import { Socket } from 'ngx-socket-io';

@Component({
  selector: 'app-play-list',
  templateUrl: './play-list.component.html',
  styleUrls: ['./play-list.component.css']
})
export class PlayListComponent implements OnInit {
  @Input() playlistToggle;
  @Input() videoPlaylist;
  @Input() playlistNames;
  @Input() repeat;
  @Input() shuffle;
  private _listSub: Subscription;
  playlist: PlayList;

  constructor(
    private youtubePlayer: YoutubePlayerService,
    private playlistService: PlaylistStoreService,
    private syncService: SyncService,
    private socket: Socket
  ) {
    this.youtubePlayer.videoChangeEvent.subscribe(event => event ? this.playNextVideo() : false);
  }


  ngOnInit(){
    this._listSub = this.syncService.currentPlayList.pipe(
      startWith({ id: '', list: []})
    ).subscribe(playlist => this.playlist = playlist);

    this.syncService.getRemovedVideo().subscribe(res =>{
      this.videoPlaylist.splice(this.videoPlaylist.indexOf(res), 1);
      this.playlistService.removeFromPlaylist(res);
      if(this.youtubePlayer.getCurrentVideo() === res["id"]){
        this.youtubePlayer.pausePlayingVideo();
      }
    });
  }

  play(id: string): void {
    let videon;

    this.videoPlaylist.forEach((video, index) => {
      if (video.id === id) {
        videon = video;
      }
    });
    this.youtubePlayer.playVideo(id, videon.snippet.title);
    this.syncService.playVideo(videon);
  }

  currentPlaying(id: string): boolean {
    return this.youtubePlayer.getCurrentVideo() === id;
  }

  removeFromPlaylist(video: Object): void {
    this.videoPlaylist.splice(this.videoPlaylist.indexOf(video), 1);
    this.playlistService.removeFromPlaylist(video);
    if(this.youtubePlayer.getCurrentVideo() === video["id"]){
      this.youtubePlayer.pausePlayingVideo();
    }
    this.syncService.removeFromPlaylist(video);
  }

  playNextVideo(): void {
    let current = this.youtubePlayer.getCurrentVideo();
    let inPlaylist;

    if (this.repeat) {
      this.play(current);
      return;
    }

    this.videoPlaylist.forEach((video, index) => {
      if (video.id === current) {
        inPlaylist = index;
      }
    });

    if (inPlaylist !== undefined) {
      let topPos = document.getElementById(this.videoPlaylist[inPlaylist].id).offsetTop;
      let playlistEl = document.getElementById('playlist');
      if (this.shuffle) {
        let shuffled = this.videoPlaylist[this.youtubePlayer.getShuffled(inPlaylist, this.videoPlaylist.length)];
        this.youtubePlayer.playVideo(shuffled.id, shuffled.snippet.title);
        playlistEl.scrollTop = document.getElementById(shuffled).offsetTop - 100;
      } else {
        if (this.videoPlaylist.length - 1 === inPlaylist) {
          this.youtubePlayer.playVideo(this.videoPlaylist[0].id, this.videoPlaylist[0].snippet.title);
          playlistEl.scrollTop = 0;
        } else {
          this.youtubePlayer.playVideo(this.videoPlaylist[inPlaylist + 1].id, this.videoPlaylist[inPlaylist + 1].snippet.title)
          playlistEl.scrollTop = topPos - 100;
        }
      }
    }
  }
}
