import { Component, OnInit, OnDestroy } from '@angular/core';
/* eslint-disable @typescript-eslint/no-explicit-any */

@Component({
  selector: 'app-coming-soon',
  standalone: false,
  templateUrl: './coming-soon.component.html',
  styleUrl: './coming-soon.component.scss'
})
export class ComingSoonComponent implements OnInit, OnDestroy {
  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;
  countdownExpired = false;
  email = ''; // Add this line to declare the 'email' property

  private countdownInterval: any;

  ngOnInit() {
    this.setCountdown();
  }

  ngOnDestroy() {
    clearInterval(this.countdownInterval);
  }

  setCountdown() {
    const countdownDate = new Date('Mar 27, 2024 16:00:00').getTime();

    this.countdownInterval = setInterval(() => {
      const todayDate = new Date().getTime();
      const distance = countdownDate - todayDate;

      this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
      this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      this.seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (distance < 0) {
        clearInterval(this.countdownInterval);
        this.countdownExpired = true;
      }
    }, 1000);
  }
}
