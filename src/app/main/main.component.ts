import { Component, AfterViewInit, OnInit, ViewChild, AfterViewChecked, HostListener } from '@angular/core';
import { YoutubeApiService } from '../shared/services/youtube-api.service';
import { YoutubePlayerService } from '../shared/services/youtube-player.service';
import { PlaylistStoreService } from '../shared/services/playlist-store.service';
import { NotificationService } from '../shared/services/notification.service';
import { SyncService } from '../shared/services/sync.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserlistComponent } from './user-list/userlist.component';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements AfterViewInit, OnInit {
  public videoList = [];
  public videoPlaylist = [];
  public loadingInProgress = false;
  public playlistToggle = false;
  public playlistNames = false;
  public repeat = false;
  public shuffle = false;
  public playlistElement: any;
  private pageLoadingFinished = false;
  private roomId = null;
  public numberOfUsers = 4;
  public isMaster = false;


  constructor(
    private youtubeService: YoutubeApiService,
    private youtubePlayer: YoutubePlayerService,
    private playlistService: PlaylistStoreService,
    private notificationService: NotificationService,
    private syncService: SyncService,
    private route: ActivatedRoute

  ) { }

  ngOnInit() {
    this.syncService.getRoom().subscribe(res => {
      this.youtubeService.getVideos(res['playlist']).then(res => {
        this.videoPlaylist = res;
      });
    });

    setInterval(() => {this.syncService.meMaster()}, 2000);
  }

  ngAfterViewInit() {
    this.route.params.subscribe(params => {
      this.roomId = params['room'];
      if (this.roomId == null) {
        window.location.href = window.location.href + this.newRoomId();
      }
      else {
        this.syncService.joinroom(this.roomId, '');
        
      }
    });

    this.playlistElement = document.getElementById('playlist');
    
    this.syncService.isMaster().subscribe(res => {
      this.isMaster = <boolean>res;
    });
  }

  playFirstInPlaylist(): void {
    if (this.videoPlaylist[0]) {
      this.playlistElement.scrollTop = 0;
      this.syncService.playVideo(this.videoPlaylist[0].id);
      // this.youtubePlayer.playVideo(this.videoPlaylist[0].id, this.videoPlaylist[0].snippet.title);
    }
  }

  handleSearchVideo(videos: Array<any>): void {
    this.videoList = videos;
  }

  checkAddToPlaylist(video: any): void {
    if (!this.videoPlaylist.some((e) => e.id === video.id)) {
      this.videoPlaylist.push(video);

      let inPlaylist = this.videoPlaylist.length - 1;

      setTimeout(() => {
        let topPos = document.getElementById(this.videoPlaylist[inPlaylist].id).offsetTop;
        this.playlistElement.scrollTop = topPos - 100;
      });
    }
  }

  onScroll(): void{
var element = document.getElementById("searchlist");
    let atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
    if (atBottom) {
      this.searchMore();
    }
  }
  searchMore(): void {
    if (this.loadingInProgress || this.pageLoadingFinished || this.videoList.length < 1) {
      return;
    }

    this.loadingInProgress = true;
    this.youtubeService.searchNext()
      .then(data => {
        this.loadingInProgress = false;
        if (data.length < 1 || data.status === 400) {
          setTimeout(() => {
            this.pageLoadingFinished = true;
            setTimeout(() => {
              this.pageLoadingFinished = false;
            }, 10000);
          })
          return;
        }
        data.forEach((val) => {
          this.videoList.push(val);
        });
      }).catch(error => {
        this.loadingInProgress = false;
      })
  }

  clearPlaylist(): void {
    this.videoPlaylist = [];
    this.playlistService.clearPlaylist();
    this.notificationService.showNotification('Playlist cleared.');
  }

  private newRoomId() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.youtubePlayer.resizePlayer(window.innerHeight, window.innerWidth);
  }

}
