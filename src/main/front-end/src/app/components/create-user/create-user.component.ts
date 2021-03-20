import {Component, OnInit} from '@angular/core';
import { Router } from "@angular/router";
import { UserService } from "../../service/user.service";
import { User } from "../../model/user";
import {Register} from "../../model/register";


@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit {

  user: User = new User();
  submitted = false;
  form: any = {};
  register: Register;
  isSignUpFailed = false;
  errorMessage: string = '';
  age: number;


  minDate = new Date(new Date().getFullYear() - 75, new Date().getMonth(), new Date().getDay());
  maxDate = new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDay());

  pinkHeartPath: any = "../assets/images/pink-heart.png";

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    window.scroll(0,200);
  }

  save() {
    console.log('form', this.form);
    console.log('form-gender', this.form.gender);
    console.log('minDate', this.minDate);
    console.log('maxDate', this.maxDate);

    this.register = new Register(
      this.form.username,
      this.form.name,
      this.form.email,
      this.form.password,
      this.form.repeatedPassword,
      this.form.city,
      this.form.gender,
      this.form.dateOfBirth,
      this.age = this.calculateAge(this.form.dateOfBirth)
      );

    this.userService.createUser(this.register)
      .subscribe(data => {
        console.log('savedRegister', data);
        this.router.navigate(['./login']);
        this.isSignUpFailed = false;
      },
      error => {
        console.log('ERROR', error);
        this.errorMessage = error.error.errorMessage;
        this.isSignUpFailed = true;
      }
    );
  }

  public calculateAge(dateOfBirth): number {
    let timeDifference = Math.abs(Date.now() - new Date(dateOfBirth).getTime());
    return Math.floor(timeDifference / (1000 * 3600 * 24) / 365.25);
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

}
