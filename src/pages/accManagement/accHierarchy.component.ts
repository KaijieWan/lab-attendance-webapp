import { CommonModule, DatePipe } from "@angular/common";
import { Component, ViewEncapsulation, ViewChild, Output, EventEmitter } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { ConnectorModel, DataBinding, DataSourceModel, Diagram, DiagramComponent, DiagramModule, DiagramTools, HierarchicalTree, IDropEventArgs, 
  LayoutModel, NodeModel, ShapeStyleModel, IClickEventArgs, 
  AnnotationConstraints} from "@syncfusion/ej2-angular-diagrams";
import { DataManager } from "@syncfusion/ej2-data";
import { finalize } from "rxjs";
import { RolePermissionService } from "../../service/rolePermission.service";
import { UserService } from "../../service/user.service";
import { ToastrService } from "ngx-toastr";

export interface EmployeeInfo {
  Name: string;
  Role: string;
  color: string;
}
export interface UserInfo{
  username: string;
  name: string;
  role: string;
  reportsTo: string;
  color: string;
}

export interface Role {
  role: string;
  reportsTo: string;
}

Diagram.Inject(DataBinding,HierarchicalTree);
@Component({
    imports: [
            DiagramModule,
            ReactiveFormsModule, RouterOutlet, DatePipe, CommonModule
        ],
    standalone: true,
    selector: "app-accHierarchy-page",
    templateUrl: "./accHierarchy.component.html",
    styleUrl: './accHierarchy.component.scss'
})
export class AccHierarchyComponent {
  @ViewChild("diagram")
  public diagram?: DiagramComponent;

  users: Object[] = [];
  updatedUsers: Object[] = [];
  finalUsers: Object[] = [];
  distinctRoles: Role[] = [];

  currentView: 'users' | 'roles' = 'roles';

  constructor(private rolePermissionService: RolePermissionService, private userService: UserService,
    private router: Router, private toastr: ToastrService
  ){
  }

  @Output() nodeClicked: EventEmitter<string> = new EventEmitter<string>();

  ngOnInit(){
    this.userService.getAllUsers(0, 100).subscribe({
      next: (response) => {
        this.users = response.content;
        console.log("All users: ", this.users);
        this.fetchDistinctRoles();
      }
    })

    this.diagram!.scrollSettings.canAutoScroll = false;
    this.diagram!.scrollSettings.scrollLimit = "Infinity";
    
    
    
  }

  switchView(view: 'users' | 'roles'): void {
    this.currentView = view;

    if(this.currentView == 'users'){
      //this.updateUsersModel();
    }

    if(this.currentView == 'roles'){
      // Reinitialize dataSourceSettings after updatedUsers is ready
      this.dataSourceSettings = {
        id: "role",
        parentId: "reportsTo",
        dataManager: new DataManager(this.distinctRoles),
        doBinding: (nodeModel: NodeModel, data: object) => {
          nodeModel.annotations = [
            { content: (data as UserInfo).name, style: { color: "white" } }
          ];
        }
      };

      // Trigger change detection if necessary
      if (this.diagram) {
        this.diagram.dataBind();
      }
    }
  }

  click(args: IClickEventArgs) {
    if (args.actualObject) {
      const clickedNode = args.actualObject as NodeModel
      //this.toastr.info("Node clicked");
      this.toastr.info("Filter Role: " + clickedNode.annotations?.at(2)?.content);
      this.nodeClicked.emit(clickedNode.annotations?.at(2)?.content);
    }
  }

  updateUsersModel(){
    // Reinitialize dataSourceSettings after updatedUsers is ready
    this.dataSourceSettings = {
      id: "username",
      parentId: "reportsTo",
      dataManager: new DataManager([...this.finalUsers] as JSON[]),
      doBinding: (nodeModel: NodeModel, data: object) => {
        nodeModel.annotations = [
          { content: (data as UserInfo).name, style: { color: "white" } }
        ];
      }
    };

    // Trigger change detection if necessary
    if (this.diagram) {
      this.diagram.dataBind();
    }
  }

  fetchDistinctRoles(){
    this.rolePermissionService.getDistinctRoles().subscribe({
      next: (response) => {
        this.distinctRoles = response.map(item => ({
          role: item,
          reportsTo: ""
        }));
        console.log("Distinct Roles: ", this.distinctRoles);
        this.fetchReportingRoles();
      }
    })
  }

  fetchReportingRoles(){
    let completedRequests = 0;

    const roleRequests = this.distinctRoles.forEach(item => {
      this.rolePermissionService.getRolePermissions(item.role).subscribe({
        next: (response) => {          
          item.reportsTo = response[0].reportsTo ? response[0].reportsTo.split(',') : null;

          completedRequests++;

          // When all requests are complete, update users
          if (completedRequests === this.distinctRoles.length) {
            console.log('distinctRoles after processing:', this.distinctRoles);
            this.updateUsers();
          }
        }
      })
    })
  }

  updateUsers(){
    this.updatedUsers = this.users.map(user => ({
      ...user,
      reportingRoles: this.distinctRoles.find(distinctRole => distinctRole.role === (user as any)['role'])?.reportsTo || null,
    }))

    console.log("Updated User List: ", this.updatedUsers);

    const temp = [...this.updatedUsers];

    this.finalUsers = this.updatedUsers.map(updatedUser => ({
      ...updatedUser,
      reportsTo: (updatedUser as any)['reportingRoles'] == null
      ? null
      :temp
        .filter(tempUser => 
          Array.isArray((updatedUser as any)['reportingRoles']) && 
          (updatedUser as any)['reportingRoles'].includes((tempUser as any)['role'])
        )
        .map(tempUser => (tempUser as any)['username']) || null
    }))

    console.log("Final User List: ", this.finalUsers);    

    this.switchView('roles');
    //this.updateUsersModel();
  }

  public dataSourceSettings?: DataSourceModel = {
      id: "role",
      parentId: "reportsTo",
      dataManager: new DataManager(this.distinctRoles),
      doBinding: (nodeModel: NodeModel, data: object) => {
        nodeModel.annotations = [
          { content: (data as UserInfo).name, style: { color: "white" } }
        ];
      }
  };
  

  public layout: LayoutModel = {
    type:'OrganizationalChart'
  };

  
  public nodeDefaults(node: NodeModel): NodeModel {
    let codes: Object = {
      "super-admin": "#008B8B",
      "professor": "#006400",
      "teaching-assistant": "#1E1E71",
      "student_assistant": "#4B0082",
      "course-coordinator": "#FF8C00",
      "hardware-lab-manager": "#8B0000",
      "software-lab-manager": "#483D8B",
      "college-admin": "#A52A2A",
      "lab-executive": "#228B22"
    };
    node.width = 160;
    node.height = 30;
    node.annotations = [
      { content: (node.data as UserInfo).username, style: { color: "lightgray", fontSize: 12 },  offset: { x: 0.5, y: 0.25 }},
      { content: (node.data as UserInfo).name, style: { color: "white" } },
      { content: (node.data as UserInfo).role, style: { color: "white", fontSize: 15 },  offset: { x: 0.5, y: 0.5 },  constraints: AnnotationConstraints.ReadOnly,}
    ];
    ((node as NodeModel).style as ShapeStyleModel).fill = (codes as any)[(node.data as UserInfo).role] as string;
    return node;
  }

  public connectorDefaults(connector: ConnectorModel): ConnectorModel {
    connector.type = "Orthogonal";
    connector.cornerRadius = 7;
    return connector;
  }

  public tool: DiagramTools = DiagramTools.None;

  public drop(args: IDropEventArgs) {
    if(this.diagram){
      //Argument element is used to get the dropped node.
      let node: NodeModel = args.element as NodeModel;
      //Gets the connector that connected to dropped node.
      let edges: string[] = this.diagram.getEdges(node);
      let connector: ConnectorModel = this.diagram.getObject(edges[0]);
      //Argument target is used to get the hovered node.
      connector.sourceID = (args.target as NodeModel).id;
      this.diagram.dataBind();
      // doLayout is used to rearrange the nodes and connectors in the diagram.
      this.diagram.doLayout();
    }    
  }

  goBack(){
    this.router.navigate(['/drawer/accManagement']);
  }

  

}