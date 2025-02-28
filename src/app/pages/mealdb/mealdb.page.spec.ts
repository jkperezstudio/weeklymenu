import { of } from 'rxjs';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MealDbPage } from './mealdb.page';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { AngularFirestore } from '@angular/fire/compat/firestore';

const firestoreMock = {
  collection: jasmine.createSpy().and.callFake(() => ({
    valueChanges: jasmine.createSpy().and.returnValue(of([{ id: '1', name: 'Mock Meal' }])), // Devuelve un array de objetos de prueba
    snapshotChanges: jasmine.createSpy().and.returnValue(of([{ payload: { doc: { id: '1', data: () => ({ name: 'Mock Meal' }) } } }])),
    doc: jasmine.createSpy().and.callFake((id: string) => ({
      get: jasmine.createSpy().and.returnValue(of({ exists: true, data: () => ({ name: 'Mock Meal' }) })),
      set: jasmine.createSpy(),
      update: jasmine.createSpy(),
      delete: jasmine.createSpy()
    }))
  }))
};




// Mock de ion-content
@Component({ selector: 'ion-content', template: '' })
class MockIonContent { }

describe('MealDbPage', () => {
  let component: MealDbPage;
  let fixture: ComponentFixture<MealDbPage>;

  beforeAll(() => {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MealDbPage
      ],
      declarations: [MockIonContent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => '2025-02-27' }), // Simula un parámetro de ruta para DailyView
            queryParams: of({ refresh: true }) // Simula queryParams para MealDb
          }
        }
        ,
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        { provide: AngularFirestore, useValue: firestoreMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MealDbPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});