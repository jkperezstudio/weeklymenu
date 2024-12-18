import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { IonIcon } from "@ionic/angular/standalone";

@Component({
  selector: 'app-image-options-sheet',
  templateUrl: './image-options-sheet.component.html',
  styleUrls: ['./image-options-sheet.component.scss'],
  standalone: true,
  imports: [IonIcon]
})
export class ImageOptionsSheetComponent {
  constructor(private bottomSheetRef: MatBottomSheetRef<ImageOptionsSheetComponent>) { }

  onOption(option: string) {
    this.bottomSheetRef.dismiss(option); // Cierra y devuelve la opción seleccionada
  }

  onClose() {
    this.bottomSheetRef.dismiss();
  }
}
