import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserAppComponent } from './user-app.component';
import { UserService } from '../services/user.service';
import { SharingDataService } from '../services/sharing-data.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User } from '../models/user';

describe('UserAppComponent', () => {
  let component: UserAppComponent;
  let fixture: ComponentFixture<UserAppComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let sharingDataSpy: jasmine.SpyObj<SharingDataService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const activatedRouteMock = {
      params: of({ id: 1 }) 
    };
    const userServiceMock = jasmine.createSpyObj('UserService', ['findAll', 'update', 'create', 'remove']);
    const sharingDataMock = jasmine.createSpyObj('SharingDataService', ['findUserByIdEventEmitter', 'newUserEventEmitter', 'idUserEventEmitter', 'selectUserEventEmitter', 'errorsUserFormEventEmitter']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ UserAppComponent ],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: SharingDataService, useValue: sharingDataMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    sharingDataSpy = TestBed.inject(SharingDataService) as jasmine.SpyObj<SharingDataService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(UserAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch users on initialization', () => {
    const usersMock: User[] = [
      { id: 1, name: 'John', lastname: 'Doe', email: 'john@example.com', username: 'johndoe', password: 'password' }
    ];
    userServiceSpy.findAll.and.returnValue(of(usersMock));

    component.ngOnInit();

    expect(userServiceSpy.findAll).toHaveBeenCalled();
    expect(component.users).toEqual(usersMock);
  });

  it('should add a new user when newUserEventEmitter emits a user', () => {
    const newUser: User = { id: 0, name: 'Jane', lastname: 'Doe', email: 'jane@example.com', username: 'janedoe', password: 'password' };
    const createdUser: User = { ...newUser, id: 1 };
    spyOn(sharingDataSpy.newUserEventEmitter, 'subscribe').and.callFake(callback => callback(newUser));
    userServiceSpy.create.and.returnValue(of(createdUser));

    component.addUser();

    expect(userServiceSpy.create).toHaveBeenCalledWith(newUser);
    expect(component.users).toContain(createdUser);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users'], { state: { users: component.users } });
  });

  it('should update an existing user when newUserEventEmitter emits a user with an id', () => {
    const existingUser: User = { id: 1, name: 'John', lastname: 'Doe', email: 'john@example.com', username: 'johndoe', password: 'password' };
    const updatedUser: User = { id: 1, name: 'John', lastname: 'Doe', email: 'john_new@example.com', username: 'johndoe', password: 'password' };
    component.users = [existingUser];
    spyOn(sharingDataSpy.newUserEventEmitter, 'subscribe').and.callFake(callback => callback(updatedUser));
    userServiceSpy.update.and.returnValue(of(updatedUser));

    component.addUser();

    expect(userServiceSpy.update).toHaveBeenCalledWith(updatedUser);
    expect(component.users).toContain(updatedUser);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users'], { state: { users: component.users } });
  });

  it('should handle errors when creating a user', () => {
    const newUser: User = { id: 0, name: 'Jane', lastname: 'Doe', email: 'jane@example.com', username: 'janedoe', password: 'password' };
    const errorResponse = { error: 'Error creating user' };
    spyOn(sharingDataSpy.newUserEventEmitter, 'subscribe').and.callFake(callback => callback(newUser));
    userServiceSpy.create.and.returnValue(throwError(errorResponse));

    component.addUser();

    expect(userServiceSpy.create).toHaveBeenCalledWith(newUser);
    expect(sharingDataSpy.errorsUserFormEventEmitter.emit).toHaveBeenCalledWith(errorResponse.error);
  });

  it('should remove a user when idUserEventEmitter emits an id', () => {
    const userId = 1;
    const usersMock: User[] = [{ id: 1, name: 'John', lastname: 'Doe', email: 'john@example.com', username: 'johndoe', password: 'password' }];
    component.users = usersMock;
    spyOn(sharingDataSpy.newUserEventEmitter, 'subscribe').and.callFake(callback => callback(userId));
    userServiceSpy.remove.and.returnValue(of(void 0));

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,  
      value: null,         
    }));

    component.removeUser();

    expect(Swal.fire).toHaveBeenCalled();
    expect(userServiceSpy.remove).toHaveBeenCalledWith(userId);
    expect(component.users.length).toBe(0);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users/create'], { skipLocationChange: true });
  });

  it('should find a user by id when findUserByIdEventEmitter emits', () => {
    const newUser: User = { id: 1, name: 'John', lastname: 'Doe', email: 'john@example.com', username: 'johndoe', password: 'password' };
    component.users = [newUser];
    spyOn(sharingDataSpy.newUserEventEmitter, 'subscribe').and.callFake(callback => callback(newUser));


    component.findUserById();

    expect(sharingDataSpy.selectUserEventEmitter.emit).toHaveBeenCalledWith(newUser);
  });
});
