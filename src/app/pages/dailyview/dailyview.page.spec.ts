import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyViewPage } from './dailyview.page';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Component } from '@angular/core';




@Component({ selector: 'ion-item', template: '<ng-content></ng-content>' })
class MockIonItem { }

@Component({ selector: 'ion-label', template: '<ng-content></ng-content>' })
class MockIonLabel { }

@Component({ selector: 'ion-input', template: '' })
class MockIonInput { }

@Component({ selector: 'ion-button', template: '' })
class MockIonButton { }

// Añade estos mocks al archivo de prueba
@Component({ selector: 'ion-content', template: '<ng-content></ng-content>' })
class MockIonContent { }

@Component({ selector: 'ion-card', template: '<ng-content></ng-content>' })
class MockIonCard { }

@Component({ selector: 'ion-card-header', template: '<ng-content></ng-content>' })
class MockIonCardHeader { }

@Component({ selector: 'ion-card-title', template: '<ng-content></ng-content>' })
class MockIonCardTitle { }

@Component({ selector: 'ion-fab', template: '<ng-content></ng-content>' })
class MockIonFab { }

@Component({ selector: 'ion-fab-button', template: '<ng-content></ng-content>' })
class MockIonFabButton { }

@Component({ selector: 'ion-icon', template: '' })
class MockIonIcon { }

@Component({ selector: 'ion-card-content', template: '<ng-content></ng-content>' })
class MockIonCardContent { }

@Component({ selector: 'ion-reorder-group', template: '<ng-content></ng-content>' })
class MockIonReorderGroup { }

@Component({ selector: 'ion-item-sliding', template: '<ng-content></ng-content>' })
class MockIonItemSliding { }

@Component({ selector: 'ion-checkbox', template: '' })
class MockIonCheckbox { }

@Component({ selector: 'ion-item-options', template: '<ng-content></ng-content>' })
class MockIonItemOptions { }

@Component({ selector: 'ion-item-option', template: '<ng-content></ng-content>' })
class MockIonItemOption { }

@Component({ selector: 'ion-modal', template: '<ng-content></ng-content>' })
class MockIonModal { }

@Component({ selector: 'ion-header', template: '<ng-content></ng-content>' })
class MockIonHeader { }

@Component({ selector: 'ion-toolbar', template: '<ng-content></ng-content>' })
class MockIonToolbar { }

@Component({ selector: 'ion-select', template: '<ng-content></ng-content>' })
class MockIonSelect { }

@Component({ selector: 'ion-select-option', template: '<ng-content></ng-content>' })
class MockIonSelectOption { }

@Component({ selector: 'ion-list', template: '<ng-content></ng-content>' })
class MockIonList { }

@Component({ selector: 'ion-range', template: '<ng-content></ng-content>' })
class MockIonRange { }

@Component({ selector: 'ion-toggle', template: '<ng-content></ng-content>' })
class MockIonToggle { }

@Component({ selector: 'ion-datetime', template: '<ng-content></ng-content>' })
class MockIonDatetime { }


console.log('DailyViewPage:', DailyViewPage);
addIcons({ chevronBackOutline, chevronForwardOutline });

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


describe('DailyViewPage', () => {
  let component: DailyViewPage;
  let fixture: ComponentFixture<DailyViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        DailyViewPage
      ],
      declarations:
        [MockIonItem,
          MockIonLabel,
          MockIonInput,
          MockIonButton,
          MockIonItem,
          MockIonLabel,
          MockIonInput,
          MockIonButton,
          MockIonContent,
          MockIonCard,
          MockIonCardHeader,
          MockIonCardTitle,
          MockIonFab,
          MockIonFabButton,
          MockIonIcon,
          MockIonCardContent,
          MockIonReorderGroup,
          MockIonItemSliding,
          MockIonCheckbox,
          MockIonItemOptions,
          MockIonItemOption,
          MockIonModal,
          MockIonHeader,
          MockIonToolbar,
          MockIonSelect,
          MockIonSelectOption,
          MockIonList,
          MockIonRange,
          MockIonToggle,
          MockIonDatetime,
        ],

      providers: [
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore()),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => '2025-02-27' }),
            queryParams: of({ refresh: true })
          }
        },
        { provide: AngularFirestore, useValue: firestoreMock }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]

    }).compileComponents();

    fixture = TestBed.createComponent(DailyViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

