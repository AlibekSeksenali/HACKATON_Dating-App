import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {User} from "../../model/user";
import {UserService} from "../../service/user.service";
import {HttpClient, HttpEventType, HttpResponse} from "@angular/common/http";
import {PersonalDetails} from "../../model/personal-details";
import {Appearance} from "../../model/appearance";
import {Comment} from "../../model/comment";
import {Vote} from "../../model/vote";
import {OtherService} from "../../service/other.service";
import {TokenService} from "../../service/token.service";
import {Rating} from "../../model/rating";
import {NgForm} from "@angular/forms";
import {Image} from "../../model/image";
import { ImageCroppedEvent } from 'ngx-image-cropper';
import {NgxImageCompressService} from 'ngx-image-compress';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css'],
})
export class UserDetailsComponent implements OnInit{

  id: number;
  user: User = new User();
  errorMessage = '';

  usernameFromToken: string;
  usernameFromSnapshot: string;
  allowAccess = false;

  isReadyToDisplay = false;

  personalDetails: PersonalDetails = new PersonalDetails();
  appearance: Appearance = new Appearance();
  vote: Vote = new Vote();

  comment: Comment = new Comment();
  comments: Comment[];
  commentAvatar: any;
  authorDetails: PersonalDetails = new PersonalDetails();
  postId: number = 0;

  selectedFiles: FileList;
  imageChangedEvent: any = '';
  croppedImage: any = '0';
  photoToSend: File = null;
  avatarUploadProgress: string = null;
  photoUploadProgress: string = null;
  avatarErrorMessage: string;
  photoId: number = 0;
  photoErrorMessage: string;
  typeOfFile: string;
  image: any = '0';

  images: Image[];
  title: string;

  currentRate = 0;

  isVoted = true;
  rating: Rating = new Rating();

  isLogged = false;

  username: string;

  constructor(private route: ActivatedRoute, private router: Router, private userService: UserService,
              private http: HttpClient, private otherService: OtherService, private tokenService: TokenService,
              private imageCompress: NgxImageCompressService) {
  }

  ngOnInit() {

    this.username = this.route.snapshot.params['username'];

    console.log('=== Jestem w UserDetailsComponent.ngOnInit przed pobraniem username z tokenService ==='), new Date();

    this.usernameFromToken = this.tokenService.getUsername();

    this.otherService.checkIfLoggedUserVoted(this.username, this.usernameFromToken).subscribe((isVoted: boolean) => {
      this.isVoted = isVoted;
      console.log('isVotedIn', this.isVoted);
    });
    console.log('isVotedOut', this.isVoted);

    if(this.usernameFromToken) {
      this.isLogged = true;
    }

    this.getAccess();

    this.loadUser(this.username);
    /*this.loadPersonalDetails(this.user);
    this.loadAppearance(this.user);
    this.loadComments(this.user);
    this.loadImages(this.user);*/

    window.scroll(0,0);
  }

  loadUser(username: string){
    return this.userService.getUser(username)
      .subscribe(data => {
        console.log('user: ', data);
        this.user = data;
        this.loadPersonalDetails(this.user);
        this.loadAppearance(this.user);
        this.loadComments(this.user);
        this.loadImages(this.user);
      }, error => console.log(error));
  }

  loadPersonalDetails(user: User){
    return this.otherService.getPersonalDetails(user.id)
      .subscribe(data => {
          console.log('personalDetails: ', data);
          this.personalDetails = data;
          this.isReadyToDisplay = true;
        },
        error => console.log(error));
  }

  loadAppearance(user: User){
    return this.otherService.getAppearance(user.id)
      .subscribe(data => {
          console.log('appearance: ', data);
          this.appearance = data;
        },
        error => console.log(error));
  }

  loadComments(user: User){
    return this.otherService.getComments(user.id)
      .subscribe(data => {
          console.log('comments: ', data);
          this.comments = data;
          this.comments.sort((a, b)=> {return new Date(a.postDate).getTime() - new Date(b.postDate).getTime()});
        },
        error => console.log(error));
  }

   loadImages(user: User){
    return this.otherService.getImages(user.id)
      .subscribe(data => {
          console.log('images: ', data);
          this.images = data;
          this.photoUploadProgress = '';
          this.title = '';
        },
        error => console.log(error));
  }


  onAvatarSelected(event){
    this.croppedImage = '';
    this.imageChangedEvent = event;
    this.personalDetails.photo = null;
    console.log('event(file): ', event);
  }

 onFileSelected(event){
    this.selectedFiles = event.target.files;
    console.log('event(file): ', event);
    console.log('selectedFiles:', this.selectedFiles);
  }

  uploadFile(){
    this.imageCompress.uploadFile().then(({image, orientation}) => {
      console.warn('Size in bytes was:', this.imageCompress.byteCount(image));
      this.imageCompress.compressFile(image, null, 30, 30).then(
        result => {
          this.image = result;
          console.warn('Size in bytes is now:', this.imageCompress.byteCount(result));
        }
      );
    });
  }

  onGalleryUpload(){
    const formData: FormData = new FormData();
    this.photoToSend = new File([this.dataURItoBlob(this.image)], 'image.png', { type: this.typeOfFile });
    formData.append('photo', this.photoToSend);
    if(this.title == null){
      this.title = '';
    }
    formData.append('title', this.title);
    this.photoUploadProgress = '0%';

     this.otherService.addImages(this.username, formData)
      .subscribe(events => {
        if(events.type === HttpEventType.UploadProgress){
          this.photoUploadProgress = Math.round(events.loaded / events.total * 100) + '%';
        }
        console.log('File is completely uploaded!');
        console.log('imageAdded: ', events);
        this.image = '';
        this.loadImages(this.user);
      },error => {
        this.photoErrorMessage = error.error.errorMessage;
        this.photoUploadProgress = '';
        console.log("file error", this.photoErrorMessage);
      });

  }

  editPhoto(id: number){
    this.photoId = id;
  }

  editTitle(image: Image){
    this.otherService.editImage(image.id, image)
      .subscribe(data => {
        console.log('editedImage: ', data);
        this.photoId = 0;
        this.title = '';
      }, err => {
        console.log(err);
      });
  }

  deletePhoto(id: number){
    this.otherService.deleteImage(id)
      .subscribe(data => {
        console.log('deletedImage: ', data);
        this.loadImages(this.user);
      }, err => {
        console.log(err);
      });
  }

  imageCropped(croppedEvent) {
      this.croppedImage = croppedEvent.base64;
      console.log('croppedEvent:', croppedEvent)
    }

  dataURItoBlob(dataURI): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    this.typeOfFile = mimeString;
    console.log('mimeString:', mimeString)
    const ab = new ArrayBuffer(byteString.length);
    let bytes = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeString });
  }

  onUpload(){
    this.photoToSend = new File([this.dataURItoBlob(this.croppedImage)], 'avatar.png', { type: this.typeOfFile });
    console.log('photoToSend:', this.photoToSend)
    const formData: FormData = new FormData();
    formData.append('file', this.photoToSend);
    this.avatarUploadProgress = '0%';

    this.otherService.changeAvatar(this.username, formData)
    .subscribe(events => {
        if(events.type === HttpEventType.UploadProgress){
          this.avatarUploadProgress = Math.round(events.loaded / events.total * 100) + '%';
        }
        console.log(events.body);
        console.log('File is completely uploaded!');
        this.imageChangedEvent = '';
        this.loadPersonalDetails(this.user);
      },error => {
        this.avatarErrorMessage = error.error.errorMessage;
        this.avatarUploadProgress = '';
        console.log("file error", this.avatarErrorMessage);
    });

  }

  reloadData(username: string) {
    this.router.navigate(['/profile', username]);
  }

  list(){
    this.router.navigate(['users']);
  }

  getAccess(){
    return this.userService.getUser(this.username)
      .subscribe(data => {
        this.user = data;
        this.usernameFromSnapshot = this.user.username;
        if(this.usernameFromToken){
          if(this.usernameFromToken === this.usernameFromSnapshot){
            this.allowAccess = true;
            console.log('ACCESS: ', this.allowAccess);
          }
        }
      }, error => console.log(error));

  }

  addComment(form: NgForm){
    console.log('ppostForm: ', form);
    this.comment.content = form.value.content;
    console.log('comment.content: ', this.comment.content);
    this.comment.author = this.usernameFromToken;
    this.comment.postDate = new Date();

    this.otherService.addComment(this.user.id, this.comment)
      .subscribe(data => {
        console.log('addedComment: ', data);
        this.loadComments(this.user);
        this.comment.content = '';
      }, err => {
        console.log(err);
      });
  }

  editPost(id: number){
    this.postId = id;
  }

  editComment(commentUpdated: Comment){
    let comment: Comment = new Comment();
    comment.content = commentUpdated.content;
    comment.postDate = commentUpdated.postDate;

    this.otherService.editComment(commentUpdated.id, comment)
      .subscribe(data => {
        console.log('editedComment: ', data);
        this.postId = 0;
      }, err => {
        console.log(err);
      });
  }

  deleteComment(id: number){
    this.otherService.deleteComment(id)
      .subscribe(data => {
        console.log('deletedComment: ', data);
        this.loadComments(this.user);
      }, err => {
        console.log(err);
      });
  }

  onVote(vote: Vote){

    vote.value = this.currentRate;
    vote.author = this.usernameFromToken;

    this.otherService.addVote(this.username, vote)
      .subscribe(data => {
        console.log('addedVote: ', data);
        this.isVoted = true;
      }, err => {
        console.log(err);
      });

    this.otherService.getRatingInfo(this.username).subscribe( rating => {
      this.rating = rating;
      console.log('ratingInfo: ', rating);

      this.rating.countedVotes++;
      this.rating.sumOfVotes += this.currentRate;
      this.personalDetails.rating = this.rating.sumOfVotes / this.rating.countedVotes;

      this.otherService.updatePersonalDetails(this.user.id, this.personalDetails)
        .subscribe(data => {
            console.log('updatedPersonalDetailsForRating: ', data)
          }, error => console.log(error));
    }, error => console.log(error));

    this.reloadData(this.username);

  }

    privateChat(username: string){
      this.router.navigate(['chat', username]);
    }


}
