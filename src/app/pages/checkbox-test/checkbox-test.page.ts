import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonCheckbox } from '@ionic/angular/standalone';

@Component({
  selector: 'app-checkbox-test',
  templateUrl: './checkbox-test.page.html',
  styleUrls: ['./checkbox-test.page.scss'],
  standalone: true,
  imports: [IonCheckbox, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CheckboxTestPage implements OnInit {
  isChecked = false;

  constructor() { }

  ngOnInit() {
  }

  onCheckboxChange() {
    console.log('Checkbox cambiado:', this.isChecked);
  }

}
