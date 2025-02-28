import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MealFormPage } from './mealform.page';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';

describe('MealFormPage', () => {
  let component: MealFormPage;
  let fixture: ComponentFixture<MealFormPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MealFormPage
      ],
      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        { provide: ActivatedRoute, useValue: { params: of({}) } } // 🔹 Se añade ActivatedRoute
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MealFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
