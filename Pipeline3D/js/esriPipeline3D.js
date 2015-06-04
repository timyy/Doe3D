dojo.require("esri.map");
dojo.require("dijit.dijit");
dojo.require("esri.toolbars.draw");
dojo.require("esri.tasks.identify");
dojo.require("iSpring.widgets.MapToolbar");
dojo.require("iSpring.widgets.PipeToolbar");
dojo.require("iSpring.widgets.PipeTOC");
dojo.require("iSpring.widgets.PipeIdentify");
dojo.require("iSpring.widgets.SystemMenu");


var map, drawToolbar, extentSymbol, identifyTask, identifyParas;
var scene, camera, renderer;
var bLeftButtonDown = false;
var handleMouseMove;
var previousX = -1, previousY = -1;
var mapService = "http://localhost/ArcGIS/rest/services/Pipe/MapServer";
var StaticRotateRadianY = Math.PI / 180;

function init() {
    map = new esri.Map('mapId');
    var layer = new esri.layers.ArcGISDynamicMapServiceLayer(mapService);
    map.addLayer(layer);
    dojo.connect(map, "onLoad", "mapOnLoad");

    init3D();
    animateRefresh();
}

function animateRefresh() {
    requestAnimationFrame(animateRefresh);
    renderer.render(scene, camera);
}

function mapOnLoad() {
    drawToolbar = new esri.toolbars.Draw(map);
    dojo.connect(drawToolbar, "onDrawEnd", "drawEnd");
    dojo.connect(map, 'onResize', map, map.resize);
    extentSymbol = drawToolbar.fillSymbol;
    drawToolbar.activate(esri.toolbars.Draw.EXTENT);

    systemMenu.setMap(map);

    initIdentify();
}

function createMapToolbar(Map) {
    var bar = new iSpring.widgets.MapToolbar({map: Map});
    bar.placeAt(dojo.body());
    bar.startup();
}

function createPipeToolbar(Scene) {
    var bar = new iSpring.widgets.PipeToolbar({scene: Scene});
    bar.placeAt(dojo.body());
    bar.startup();
}

function createPipeTOC(Scene) {
    var toc = new iSpring.widgets.PipeTOC({scene: Scene});
    toc.placeAt(dojo.body());
    toc.startup();
}

function createPipeIdentify(Attributes) {
    var pipeIdentify = new iSpring.widgets.PipeIdentify({attributes: Attributes});
    pipeIdentify.placeAt(dojo.body());
    pipeIdentify.startup();
}

function initIdentify() {
    identifyTask = new esri.tasks.IdentifyTask(mapService);
    identifyParas = new esri.tasks.IdentifyParameters();
    identifyParas.mapExtent = map.extent;
    identifyParas.tolerance = 3;
    identifyParas.returnGeometry = true;
    identifyParas.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
    identifyParas.width = map.width;
    identifyParas.height = map.height;
    dojo.connect(identifyTask, "onComplete", "identifyCallback");//ע��������
    dojo.connect(identifyTask, "onError", "identifyErrorback");//ע��������
}

function drawEnd(geometry) {
    map.graphics.clear();
    var graphic = new esri.Graphic(geometry, extentSymbol);
    map.graphics.add(graphic);
    doIdentify(geometry);
}

function doIdentify(geometry) {
    identifyParas.geometry = geometry;
    identifyTask.execute(identifyParas);
}

function identifyCallback(results) {
    var center = identifyParas.geometry.getCenter();
    identifyParas.geometry = null;
    if (!scene.initCenter) {
        scene.initCenter = center;
    }
    create3D(scene.initCenter, results);
}

function identifyErrorback(error) {
    identifyParas.geometry = null;
    console.log(error);
}

function init3D() {
    if (!Detector.webgl) {
        if (Detector.canvas) {
            renderer = new THREE.CanvasRenderer();
        }
        else {
            alert('Sorry,�����������֧��3D��')
        }
    } else {
        renderer = new THREE.WebGLRenderer({antialias: true});//����WebGL�����
    }
    scene = new THREE.Scene();

    var container = dojo.byId("container");
    var width = dojo.style(container, "width");
    var height = dojo.style(container, "height");
    var viewAngle = 45;
    var aspect = width / height;
    var near = 0.1;
    var far = 10000;
    camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
    camera.position.set(10, 70, 80);
    scene.add(camera);


    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);

    camera.target = scene.position;
    camera.lookAt(scene.position);
    dojo.connect(window, 'resize', function () {
        var container = dojo.byId("container");
        var width = dojo.style(container, "width");
        var height = dojo.style(container, "height");
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    dojo.connect(container, 'mousedown', onSceneMouseDown);
    dojo.connect(container, 'mouseup', onSceneMouseUp);
    dojo.connect(container, 'mousewheel', onMouseWheel);
    dojo.connect(container, 'DOMMouseScroll', onMouseWheel);
    scene.pipeOperationMode = "PAN";
    renderer.render(scene, camera);

    systemMenu.setScene(scene);

}


function create3D(center, results) {
    dojo.forEach(results, function (item, index, results) {
        var graphic = item.feature;

        var uniqueId = graphic.attributes.LayerName + graphic.attributes.OBJECTID;
        var bExist = checkExist(uniqueId);
        if (!bExist) {
            if (item.geometryType == "esriGeometryPolyline" && item.layerName.indexOf('����') >= 0) {

                var mesh = createPipeCylinderByGraphic(graphic, center);
                if (mesh != null) {
                    mesh.graphic = item.feature;
                    mesh.uniqueId = uniqueId;
                    scene.add(mesh);
                }
            }
            else if (item.geometryType == "esriGeometryPoint" && item.layerName.indexOf('�ܵ�') >= 0) {
                createValveModelByGraphic(graphic, center);
            }
        }
    });
}

function checkExist(uniqueId) {
    var bExist = dojo.some(scene.children, function (item) {
        if (item instanceof THREE.Mesh) {
            if (item.uniqueId) {
                return item.uniqueId == uniqueId ? true : false;
            }
        }
    });

    return bExist;
}

function findMeshByUniqueId(uniqueId) {
    dojo.forEach(scene.children, function (child) {
        if (child instanceof THREE.Mesh) {
            if (child.uniqueId) {
                if (child.uniqueId == uniqueId)
                    return child;
            }
        }
    });

    return null;
}

function isZero(number) {
    if (Math.abs(number) < 0.000001) {
        return true;
    }
    else {
        return false;
    }

}


function createPipeCylinderByGraphic(graphic, center) {
    Radius = 0.4;

    var pntNumber = graphic.geometry.paths[0].length;
    var firstPnt = graphic.geometry.getPoint(0, 0);
    var x1 = firstPnt.x - center.x;
    var y1 = parseFloat(graphic.attributes.SCEN_H);
    var z1 = center.y - firstPnt.y;

    var lastPnt = graphic.geometry.getPoint(0, pntNumber - 1);
    var x2 = lastPnt.x - center.x;
    var y2 = parseFloat(graphic.attributes.ECEN_H);
    var z2 = center.y - lastPnt.y;

    var color = GetColorByPipeType(graphic.attributes.LayerName);

    var mesh = createCylinderMesh(x1, y1, z1, x2, y2, z2, Radius, color);
    mesh.graphic = graphic;
    mesh.uniqueId = graphic.attributes.LayerName + graphic.attributes.OBJECTID;

    return mesh;
}

function createCylinderMesh(x1, y1, z1, x2, y2, z2, radius, Color) {
    var x0 = (x1 + x2) / 2;
    var y0 = (y1 + y2) / 2;
    var z0 = (z1 + z2) / 2;
    var p1 = new THREE.Vector3(x1, y1, z1);
    var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2) + (z1 - z2) * (z1 - z2));

    var material = new THREE.MeshBasicMaterial({color: Color});
    var geometry = new THREE.CylinderGeometry(radius, radius, length);
    geometry.applyMatrix(new THREE.Matrix4().setRotationFromEuler(new THREE.Vector3(Math.PI / 2, Math.PI, 0)));
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x0, y0, z0);
    mesh.lookAt(p1);

    return mesh;
}

function createValveModelByGraphic(graphic, center) {
    var topH = parseFloat(graphic.attributes.top_h);
    var bottomH = parseFloat(graphic.attributes.bottom_h);
    var valveX = graphic.geometry.x - center.x;
    var valveY = (topH + bottomH) / 2 + 1;
    var valveZ = center.y - graphic.geometry.y;

    var loader = new THREE.JSONLoader();
    loader.load('valve.js', function (geometry) {
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
        mesh.position.set(valveX, valveY, valveZ);
        mesh.rotation.set(1.6, 0, 0);
        mesh.scale.set(0.07, 0.07, 0.07);
        mesh.graphic = graphic;
        mesh.uniqueId = graphic.attributes.LayerName + graphic.attributes.OBJECTID;
        scene.add(mesh);
    });
}

function onMouseWheel(evt) {
    var scale = 0.0;

    if (evt.wheelDelta) {
        if (evt.wheelDelta > 0) {
            scale = 0.9;
        }
        else if (evt.wheelDelta < 0) {
            scale = 1.1;
        }
    }
    else if (evt.detail) {
        if (evt.detail < 0) {
            scale = 0.9;
        }
        else if (evt.detail > 0) {
            scale = 1.1;
        }
    }

    var PreDelta = new THREE.Vector3(camera.position.x - camera.target.x, camera.position.y - camera.target.y, camera.position.z - camera.target.z);
    var NewDelta = new THREE.Vector3(PreDelta.x * scale, PreDelta.y * scale, PreDelta.z * scale);
    camera.position.set(camera.target.x + NewDelta.x, camera.target.y + NewDelta.y, camera.target.z + NewDelta.z);
    camera.lookAt(camera.target);
}

function onSceneMouseDown(evt) {
    previousX = evt.layerX || evt.offsetX;
    previousY = evt.layerY || evt.offsetY;
    bLeftButtonDown = true;
    handleMouseMove = dojo.connect(dojo.byId("container"), 'mousemove', onSceneMouseMove);
    if (scene.pipeOperationMode == "IDENTIFY") {
        console.log("scene.pipeOperationMode==IDENTIFY");
        onIdentifySceneMouseDown(previousX, previousY);
    }
}

function onIdentifySceneMouseDown(clickX, clickY) {
    var width = dojo.style("container", "width");
    var height = dojo.style("container", "height");
    var vector = new THREE.Vector3(( clickX / width ) * 2 - 1, -( clickY / height ) * 2 + 1, 0.5);
    var projector = new THREE.Projector();
    projector.unprojectVector(vector, camera);

    var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

    var intersects = ray.intersectObjects(scene.children);

    if (intersects.length > 0) {

        //intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
        //var particleMaterial = new THREE.ParticleBasicMaterial( {  color: 0x000000});
        //var particle = new THREE.Particle( particleMaterial );
        //particle.position = intersects[ 0 ].point;
        //particle.scale.x = particle.scale.y = 20;
        //scene.add( particle );

        createPipeIdentify(intersects[0].object.graphic.attributes);
    }
}

function onSceneMouseMove(evt) {
    var currentX = evt.layerX || evt.offsetX;
    var currentY = evt.layerY || evt.offsetY;
    if (bLeftButtonDown) {
        if (scene.pipeOperationMode == "PAN") {
            onPanSceneMouseMove(currentX, currentY);
        }
        else if (scene.pipeOperationMode == "ROTATE") {
            onRotateSceneMouseMove(currentX, currentY);
        }
    }
    previousX = currentX;
    previousY = currentY;
}

function onPanSceneMouseMove(currentX, currentY) {
    //����ƽ��
    if (currentX != previousX) {
        var bLeft = currentX < previousX ? true : false;
        var plumbVector = GetPlumbVector(camera.position, camera.target, bLeft);
        camera.position.x += plumbVector.x;
        camera.position.z += plumbVector.z;
        camera.target.x += plumbVector.x;
        camera.target.z += plumbVector.z;
        camera.lookAt(camera.target);
    }

    //ǰ��ƽ��
    if (currentY != previousY) {
        var bForward = currentY < previousY ? true : false;
        var ForwardVector = GetForwardVector(camera.position, camera.target, bForward);
        camera.position.x += ForwardVector.x;
        camera.position.y += ForwardVector.y;
        camera.position.z += ForwardVector.z;
        camera.target.x += ForwardVector.x;
        camera.target.y += ForwardVector.y;
        camera.target.z += ForwardVector.z;
        camera.lookAt(camera.target);
    }
}

function onRotateSceneMouseMove(currentX, currentY) {
    var RotateRadianY = 0.0;//Χ��Y����ת�ĽǶ�
    var height = parseFloat(dojo.style('container', 'height'));
    var deltaY = 0.0;

    if (currentY >= height / 2) {
        if (previousX < currentX) {
            RotateRadianY = StaticRotateRadianY;
        }

        if (previousX > currentX) {
            RotateRadianY = -StaticRotateRadianY;
        }
    }
    else if (currentY < previousY) {
        if (previousX > currentX) {
            RotateRadianY = StaticRotateRadianY;
        }

        if (previousX < currentX) {
            RotateRadianY = -StaticRotateRadianY;
        }
    }

    if (scene.pipeOperationMode == "ROTATE")//ֻ��Y����ת
    {
        camera.position.x = camera.position.x * Math.cos(RotateRadianY) + camera.position.z * Math.sin(RotateRadianY);
        camera.position.z = -camera.position.x * Math.sin(RotateRadianY) + camera.position.z * Math.cos(RotateRadianY);
        camera.target.x = camera.target.x * Math.cos(RotateRadianY) + camera.target.z * Math.sin(RotateRadianY);
        camera.target.z = -camera.target.x * Math.sin(RotateRadianY) + camera.target.z * Math.cos(RotateRadianY);

        camera.lookAt(camera.target);
    }
}

function onSceneMouseUp(evt) {
    bLeftButtonDown = false;
    currentX = -1;
    currentY = -1;
    dojo.disconnect(handleMouseMove);
}

function GetPlumbVector(FromPoint, ToPoint, bLeft) {

    var Vector3D = new THREE.Vector3(ToPoint.x - FromPoint.x, ToPoint.y - FromPoint.y, ToPoint.z - FromPoint.z);

    var PlumbVector2D;

    var FromPoint2D = new THREE.Vector3(FromPoint.x, 0, FromPoint.z);

    var ToPoint2D = new THREE.Vector3(ToPoint.x, 0, ToPoint.z);

    var Vector2D = new THREE.Vector3(ToPoint2D.x - FromPoint2D.x, 0, ToPoint2D.z - FromPoint2D.z);

    Vector2D.normalize();

    PlumbVector2D = new THREE.Vector3(-Vector2D.z, 0, Vector2D.x);

    PlumbVector2D.normalize();

    if (bLeft) {
        var K = Vector2D.z / Vector2D.x;

        if (PlumbVector2D.z > K * PlumbVector2D.x) {
            PlumbVector2D.x *= -1;
            PlumbVector2D.z *= -1;
        }

    }
    else {
        var K = Vector2D.z / Vector2D.x;

        if (PlumbVector2D.z < K * PlumbVector2D.x) {
            PlumbVector2D.x *= -1;
            PlumbVector2D.z *= -1;
        }
    }

    return PlumbVector2D;
}

function GetForwardVector(FromPoint, ToPoint, bForward) {
    var Vector3D = new THREE.Vector3(FromPoint.x - ToPoint.x, FromPoint.y - ToPoint.y, FromPoint.z - ToPoint.z);

    var FromPoint2D = new THREE.Vector3(FromPoint.x, 0, FromPoint.z);

    var ToPoint2D = new THREE.Vector3(ToPoint.x, 0, ToPoint.z);

    var Vector2D = new THREE.Vector3(ToPoint2D.x - FromPoint2D.x, ToPoint2D.y - FromPoint2D.y, ToPoint2D.z - FromPoint2D.z);

    Vector2D.normalize();

    if (bForward) {
        Vector2D.x *= -1;
        Vector2D.z *= -1;
    }

    return Vector2D;
}

function GetColorByPipeType(PipeType) {
    var PipeColor;
    var type = PipeType;
    if (PipeType.indexOf("����") >= 0) {
        type = PipeType.replace(/����/, "");
    }
    else if (PipeType.indexOf("�ܵ�") >= 0) {
        type = PipeType.replace(/�ܵ�/, "");
    }

    switch (type) {
        case "��ҵ":
        {
            PipeColor = 0x000000;
            break;
        }
        case "��ˮ":
        case "��ˮ":
        {
            PipeColor = 0xD85B00;
            break;
        }
        case "ú��":
        {
            PipeColor = 0x19E2E8;
            break;
        }
        case "����":
        {
            PipeColor = 0x00ff00;
            break;
        }
        case "����":
        case "·��":
        {
            PipeColor = 0xff0000;
            break;
        }
        case "��ˮ":
        {
            PipeColor = 0x0000ff;
            break;
        }
    }
    return PipeColor;
}
dojo.addOnLoad(init);
