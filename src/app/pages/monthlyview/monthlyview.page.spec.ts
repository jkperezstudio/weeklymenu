import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthlyViewPage } from './monthlyview.page';
import { IonicModule } from '@ionic/angular';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { environment } from 'src/environments/environment';

describe('MonthlyViewPage', () => {
  let component: MonthlyViewPage;
  let fixture: ComponentFixture<MonthlyViewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MonthlyViewPage // Componente standalone como importación
      ],
      providers: [ // Mover los proveedores de Firebase aquí
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
        provideFirestore(() => getFirestore())
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
