/*
 Copyright (c) 2015 Rihei Endo
 Released under the MIT license
 http://opensource.org/licenses/mit-license.php
 */
////////////////////////////////////////////////////
// 仮想物理実験 r1
////////////////////////////////////////////////////
//名前空間
var PHYSICS = {REVISION: 'r1'};
///////////////////////////////////
// 物理実験室の基底クラス
///////////////////////////////////
PHYSICS.PhysLab = function (parameter) {
    parameter = parameter || {};

    //HTML要素のid名関連

    //額縁ID
    this.frameID = null;

    //スタートボタンID
    this.playButtonID = null;

    //リセットボタンID
    this.resetButtonID = null;

    //画面キャプチャID
    this.pictureID = null;

    //時間表示用要素ID
    this.timeID = null;

    //jQueryの利用の有無
    this.useJQuery = false;

    //重力定数
    this.g = 9.8;

    //1ステップあたりの時間間隔
    this.dt = 0.001;

    //ステップ数
    this.step = 0;

    //描画間引回数
    this.skipRendering = 40;

    //FPS計測の有無
    this.displayFPS = false;

    //マウスドラックの有無
    this.draggable = false;

    //マウスドラックの許可
    this.allowDrag = false;

    //軌跡の表示
    this.locusFlag = true;             // (true | false | "pause")

    //速度ベクトルの表示
    this.velocityVectorFlag = "pause"; // (true | false | "pause")

    //バウンディングボックスの表示
    this.boundingBoxFlag = "dragg";    // (true | false | "dragg")

    //ストロボオブジェクトの表示
    this.strobeFlag = true;            // (true | false | "pause")

    //軌跡の表示ID
    this.locusButtonID = null;

    //速度ベクトルの表示ID
    this.velocityVectorButtonID = null;

    //ストロボ表示ID
    this.strobeButtonID = null;

    //復元用実験室データファイル名
    this.loadFilePath = null;

    //保存データダウンロードボタンID
    this.saveDataDownloadButtonID = null;

    //時間発展を一時停止させる時間の配列
    this.pauseStepList = [];

    //レンダラ関連パラメータ
    this.renderer = {
        clearColor: 0xFFFFFF, //クリアーカラー（背景色）
        clearAlpha: 1.0,      //クリアーアルファ値（背景色）
        parameters: {         //WebGLRendererクラスのコンストラクタに渡すパラメータ 
            antialias: true,   //アンチエイリアス（デフォルト：false）
            stencil: true,     //ステンシルバッファ（デフォルト：true）
            alpha: true        //アルファテスト（デフォルト：false）
        }
    }

    //カメラパラメータ
    this.camera = {
        type: "Perspective",          //カメラの種類（ "Perspective" | "Orthographic"）
        position: {x: 15, y: 0, z: 15}, //カメラの位置座標
        up: {x: 0, y: 0, z: 1},   //カメラの上ベクトル
        target: {x: 0, y: 0, z: 0},   //カメラの向き中心座標
        fov: 45,                  //視野角
        near: 0.1,                 //視体積手前までの距離
        far: 500,                 //視体積の奥までの距離
        left: -10,                  //視体積の左までの距離（正投影）
        right: 10,                  //視体積の右までの距離（正投影）
        top: 10,                  //視体積の上までの距離（正投影）
        bottom: -10,                  //視体積の下までの距離（正投影）
    };

    //光源パラメータ
    this.light = {
        type: "Directional",         //光源の種類（ "Directional" | "Spot" | "Point"）
        position: {x: 0, y: 0, z: 10}, //光源位置
        target: {x: 0, y: 0, z: 0},     //光源の向き（平行光源, スポットライト光源）
        color: 0xFFFFFF,              //光源色
        intensity: 1,                 //光源強度
        distance: 0,                  //距離減衰指数（スポットライト光源, 点光源）
        angle: Math.PI / 4,             //角度（スポットライト光源）
        exponent: 20,                 //光軸からの減衰指数（スポットライト）
        ambient: null                 //環境光源色
    };

    //シャドーマップ
    this.shadow = {
        shadowMapEnabled: false,  //シャドーマップの利用
        shadowMapWidth: 512,    //シャドーマップの横幅
        shadowMapHeight: 512,    //シャドーマップの高さ
        shadowCameraVisible: false,  //シャドーマップの可視化
        shadowCameraNear: 0.1,    //シャドーカメラのサイズ（near）
        shadowCameraFar: 50,     //シャドーカメラのサイズ（far）
        shadowCameraFov: 120,    //シャドーカメラのサイズ（Fov）
        shadowCameraRight: 10,     //シャドーカメラのサイズ（right）
        shadowCameraLeft: -10,     //シャドーカメラのサイズ（left）
        shadowCameraTop: 10,     //シャドーカメラのサイズ（top）
        shadowCameraBottom: -10,     //シャドーカメラのサイズ（bottom）
        shadowDarkness: 0.5     //影の黒さ
    };

    //トラックボール
    this.trackball = {
        enabled: false,            //トラックボール利用の有無
        noRotate: false,           //トラックボールの回転無効化
        rotateSpeed: 2.0,          //トラックボールの回転速度の設定
        noZoom: false,             //トラックボールの拡大無効化
        zoomSpeed: 1.0,            //トラックボールの拡大速度の設定
        noPan: false,              //トラックボールのカメラ中心移動の無効化と中心速度の設定
        panSpeed: 1.0,             //中心速度の設定
        staticMoving: true,        //トラックボールのスタティックムーブの有効化
        dynamicDampingFactor: 0.3, //トラックボールのダイナミックムーブ時の減衰定数
    }

    //時間制御スライダー
    this.timeslider = {
        enabled: false,  //時間制御スライダー利用の有無
        skipRecord: 50,  //運動記録の間引回数
        domID: null,     //時間制御スライダーの要素のID名
        save: {          //内部プロパティ
            flag: false,   //最新データの保持フラグ
            objects: []     //３次元オブジェクトの最新情報が格納された配列
        }
    };

    //再生モード
    this.playback = {
        enabled: false,               //再生モード利用の有無
        checkID: null,                //checkボックスのID
        locusVisible: true,           //軌跡の表示
        velocityVectorVisible: false, //速度ベクトルの表示	
        strobeVisible: false          //ストロボオブジェクトの表示
    }

    //動画生成
    this.video = {
        enabled: false,         //動画生成利用の有無
        downloadButtonID: null, //動画ダウンロードボタンID
        makeButtonID: null,     //動画生成ボタンID
        speed: 30,              //動画のフレームレート
        quality: 0.8,            //動画の画質
        fileName: "video.webm", //動画のファイル名
        makeStartFlag: false,   //動画生成開始フラグ（内部）
        makingFlag: false,      //動画生成中フラグ（内部）
        finishedFlag: false,    //動画生成完了フラグ（内部）
        readyFlag: false        //動画生成完了フラグ（内部）
    }

    //スカイボックスの利用
    this.skybox = {
        enabled: false,        //スカイボックス利用の有無
        cubeMapTexture: null,  //テクスチャ
        size: 400,              //スカイボックスのサイズ
        r: {x: 0, y: 0, z: 0}     //スカイボックスの位置
    }

    //スカイドームの利用
    this.skydome = {
        enabled: false,         //スカイドーム利用の有無
        radius: 200,           //スカイドームの半径
        topColor: 0x2E52FF,     //ドーム天頂色
        bottomColor: 0xFFFFFF,  //ドーム底面色
        exp: 0.8,               //混合指数
        offset: 5               //高さ基準点
    };
    //フォグの利用
    this.fog = {
        enabled: false, //フォグ利用の有無
        type: "linear",  //フォグの種類（ "linear" | "exp" ）
        color: null,     //フォグ色
        near: 0.1,       //フォグ開始距離（線形フォグ）
        far: 30,         //フォグ終了距離（線形フォグ）
        density: 1 / 20   //フォグの濃度（指数フォグ）
    }
    //レンズフレア関連
    this.lensFlare = {
        enabled: false,         //レンズフレア利用の有無
        flareColor: 0xFFFFFF,   //フレアテクスチャの発光色
        flareSize: 300,         //フレアのサイズ
        flareTexture: null,     //フレアテクスチャ
        ghostTexture: null,     //ゴーストテクスチャ
        ghostList: [           //レンズフレアのリスト
            {size: 60, distance: 0.6},  //サイズと距離
            {size: 70, distance: 0.7},
            {size: 120, distance: 0.9},
            {size: 70, distance: 1.0},
        ]
    }

    //通信メソッドで実行する関数を格納する配列
    this.beforeInitEventFunctions = [];
    this.afterInitEventFunctions = [];
    this.beforeInit3DCGFunctions = [];
    this.afterInit3DCGFunctions = [];
    this.afterStartLabFunctions = [];
    this.beforeTimeControlFunctions = [];
    this.centerTimeEvolutionFunctions = [];
    this.afterTimeControlFunctions = [];
    this.beforeCheckFlagsFunctions = [];
    this.afterCheckFlagsFunctions = [];
    this.breforeTimeEvolutionFunctions = [];
    this.afterTimeEvolutionFunctions = [];
    this.breforeMakePictureFunctions = [];
    this.afterMakePictureFunctions = [];
    this.breforeMakeJSONSaveDataFunctions = [];
    this.afterMakeJSONSaveDataFunctions = [];
    this.beforeLoopFunctions = [];
    this.afterLoopFunctions = [];

    var list = [];

    for (var propertyName in this) {

        if (this.hasOwnProperty(propertyName)) {

            list.push(propertyName);

        }

    }
    //コピー対象プロパティリスト
    this.copyPropertyList = list;

    //物理空間に空間配置するオブジェクト
    this.objects = [];

    /////////////////////////////////////////////
    //内部パラメータ
    /////////////////////////////////////////////
    //実験室番号
    this.id = 0;

    //各種フラグ
    this.initFlag = true;   //初期フラグ
    this.pauseFlag = true;  //一時停止フラグ
    this.resetFlag = false;  //リセットフラグ

    this.makePictureFlag = true;  //画面キャプチャの生成フラグ
    this.makeSaveDataFlag = true; // セーブデータ生成フラグ

    //マウスドラック対象オブジェクト
    this.draggableObjects = [];

    //衝突判定を行う３次元オブジェクトのリスト
    this.collisionDetectionObjects = [];

    //FPS計測
    this.stats = null;

    //３次元グラフィックス関連
    this.CG = {};

    //読み込み後のデータ
    this.loadData = null;

    //復元データが与えられている場合
    if (parameter.loadFilePath) {

        //JSON形式の復元データを読み込む
        this.loadJSONSaveData(parameter.loadFilePath);

        //コンストラクタで指定したパラメータを優先
        PHYSICS.overwriteProperty(this.loadData.physLab, parameter);

        parameter = this.loadData.physLab;

        //初期状態ではない場合
        if (parameter.step > 0) {

            //初期状態フラグ（内部フラグ）を解除
            this.initFlag = false;

        }

    }

    //パラメータの設定
    this.setParameter(parameter);

    //
    this.restorePhysObjectsFromLoadData();

//////////////////////////////////////////////////////////////////////////////////////////////////////////


}
////////////////////////////////////////////////////////////////////
// クラスプロパティ
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.id = 0;

////////////////////////////////////////////////////////////////////
// パラメータ設定関数
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.setParameter = function (parameter) {
    parameter = parameter || {};

    //仮想物理実験室オブジェクト（this）に parameter に存在する全てのプロパティを設定する
    PHYSICS.overwriteProperty(this, parameter);

}
//引数で指定したオブジェクトリテラルのparameterに存在するプロパティを設定する関数
PHYSICS.overwriteProperty = function (object, parameter) {

    //parameter内の全てのプロパティを走査
    for (var propertyName in parameter) {

        //propertyNameのプロパティのクラスによって実行内容を分ける
        if (!( parameter[propertyName] instanceof Object ) || parameter[propertyName] instanceof Function) {

            //parameterのpropertyNameが通常の値（ 文字列, bool値, 数値 など）の場合、値をそのまま代入
            object[propertyName] = parameter[propertyName];

            //コピー内容をコンソールへ出力
            //console.log( PHYSICS.overwriteProperty.s + "." + propertyName + " = " + parameter[ propertyName ] );

        } else if (parameter[propertyName] instanceof Array) {

            //配列の宣言
            object[propertyName] = [];

            //配列をコピー
            for (var i = 0; i < parameter[propertyName].length; i++) {

                object[propertyName].push(parameter[propertyName][i]);

            }

            //コピー内容をコンソールへ出力
            //console.log( PHYSICS.overwriteProperty.s + "." + propertyName+ " = [" + object[ propertyName ] + "]" );

        } else if (parameter[propertyName] instanceof Object) {

            //ドットシンタックスでオブジェクトの構造を表す
            PHYSICS.overwriteProperty.s += "." + propertyName;

            //未定義の場合の処理
            object[propertyName] = object[propertyName] || {};

            //parameterのpropertyNameのプロパティがオブジェクトの場合、再帰的に本関数を呼び出す
            PHYSICS.overwriteProperty(object[propertyName], parameter[propertyName]);

        } else {

            console.log("想定外のクラスのプロパティが存在します！");

        }
    }

    PHYSICS.overwriteProperty.s = "this";
}
//コンソール出力用のプロパティの構造を表す文字列
PHYSICS.overwriteProperty.s = "this";

////////////////////////////////////////////////////////////////////
// オブジェクトのコピー
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.getProperty = function (object) {

    //プロパティ取得対象オブジェクト
    object = object || this;

    //プロパティ取得対象プロパティ
    var list = object.copyPropertyList;

    //コピー後のプロパティを格納するオブジェクト
    var newProperty = {};

    for (var i = 0; i < list.length; i++) {

        var propertyName = list[i];

        newProperty[propertyName] = PHYSICS.cloneObject(
            object[propertyName], {
                Rwords: null,               //参照コピーを行うプロパティ名を格納した配列
                Iwords: ["CG", "objects"],  //無視するプロパティ名を格納した配列
                classFlag: false,            //自作クラスのコピーまで考慮
                onlyOwnPropertyFlag: true,  //自身のプロパティのみをコピー対象とするフラグ
                layerNumber: null           //コピー階層数
            }
        );

    }

    return newProperty;

}

//引数で与えられた実験室オブジェクトあるいは３次元オブジェクトの完全コピー
PHYSICS.PhysLab.prototype.clone = function (object) {

    //コピー対象オブジェクト
    object = object || this;

    //実験室オブジェクト（３次元オブジェクト）のプロパティの取得
    var property = object.getProperty();

    //実験室オブジェクト（３次元オブジェクト）の生成
    return new object.constructor(property);

}

//第一引数で指定した任意のオブジェクトのコピーを返す
PHYSICS.cloneObject = function (oldObject, parameters) {

    parameters = parameters || {};

    //参照コピーを行うプロパティ名を格納した配列
    var Rwords = parameters.Rwords || [];
    //無視するプロパティ名を格納した配列
    var Iwords = parameters.Iwords || [];
    //自作クラスのコピーまで考慮
    var classFlag = parameters.classFlag || false;
    //自身のプロパティのみをコピー対象とするフラグ
    var onlyOwnPropertyFlag = parameters.onlyOwnPropertyFlag || false;
    //コピー階層数
    var layerNumber = parameters.layerNumber || null;
    //関数を文字列関数へ変更（JSON化）するフラグ
    var functionToStrignFlag = parameters.functionToStrignFlag || false;
    //文字列関数を関数へ変更するフラグ
    var stringToFunctionFlag = parameters.stringToFunctionFlag || false;

    if (!( oldObject ) || layerNumber === 0 ||
        oldObject.constructor === Number ||
        oldObject.constructor === Boolean ||
        oldObject.constructor === String ||
        oldObject.constructor === RegExp ||
        oldObject.constructor === Function) {

        if (oldObject && oldObject.constructor === Function && functionToStrignFlag) {

            //関数を文字列関数へ変更（JSON化）
            oldObject = oldObject.toString();

        }

        return oldObject;

    }

    //コピー階層数をデクリメント
    if (layerNumber && layerNumber.constructor === Number) {

        layerNumber--;

    } else {

        layerNumber = null;

    }

    //参照コピー→実体コピー
    if (oldObject.constructor === Array) {

        var array = [];

        for (var i = 0; i < oldObject.length; i++) {

            array[i] = PHYSICS.cloneObject(oldObject[i], parameters);

        }

        return array;

    } else if (oldObject.constructor === Date) {

        return new Date(oldObject.getDate());

    } else {

        if (classFlag) var newObject = new oldObject.constructor();
        else            var newObject = {};

        for (var propertyName in oldObject) {

            var ownPropertyFlag = oldObject.hasOwnProperty(propertyName);

            if (( classFlag && ownPropertyFlag ) ||
                (!classFlag && onlyOwnPropertyFlag && ownPropertyFlag ) ||
                (!classFlag && !onlyOwnPropertyFlag )) {

                if (propertyName === "constructor") continue;
                if (Iwords.indexOf(propertyName) > -1) continue;
                if (Rwords.indexOf(propertyName) > -1) {

                    newObject[propertyName] = oldObject[propertyName];

                } else {

                    //文字列関数を関数へ変換
                    if (oldObject[propertyName] && oldObject[propertyName].constructor === String && stringToFunctionFlag && oldObject[propertyName].search(/function/) === 0) {

                        //文字列関数を関数へ変更
                        eval("newObject[ propertyName ] = " + oldObject[propertyName]);

                    } else {

                        if (oldObject[propertyName] instanceof PHYSICS.PhysObject || oldObject[propertyName] instanceof PHYSICS.PhysLab) continue;

                        newObject[propertyName] = PHYSICS.cloneObject(oldObject[propertyName], parameters);

                    }

                }

            }

        }

        return newObject;

    }

}

//オブジェクトをJSON形式文字列に変換する
PHYSICS.objectToJSON = function (object) {

    return JSON.stringify(
        PHYSICS.cloneObject(
            object,
            {
                Rwords: null,               //参照コピーを行うプロパティ名を格納した配列
                Iwords: null,               //無視するプロパティ名を格納した配列
                classFlag: false,            //自作クラスのコピーまで考慮
                onlyOwnPropertyFlag: true,  //自身のプロパティのみをコピー対象とするフラグ
                layerNumber: null,          //コピー階層数
                functionToStrignFlag: true, //関数を文字列に変更
            }
        )
    );

}

//JSON形式文字列をオブジェクトに変換する
PHYSICS.JSONToObject = function (json) {

    return PHYSICS.cloneObject(
        JSON.parse(json),
        {
            Rwords: null,               //参照コピーを行うプロパティ名を格納した配列
            Iwords: null,               //無視するプロパティ名を格納した配列
            classFlag: false,           //自作クラスのコピーまで考慮
            onlyOwnPropertyFlag: true,  //自身のプロパティのみをコピー対象とするフラグ
            layerNumber: null,          //コピー階層数
            stringToFunctionFlag: true, //文字列関数を文字列に変更
        }
    );

}

////////////////////////////////////////////////////////////////////
// 仮想実験室の保存
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.getSaveData = function () {

    var data = {};

    //コピーに必要な実験室オブジェクトの全プロパティを取得
    data.physLab = this.getProperty();
    //３次元オブジェクトのプロパティを格納する配列
    data.objects = [];

    for (var i = 0; i < this.objects.length; i++) {

        //親要素が存在する場合はスルー
        if (this.objects[i].parent) continue;

        //コピーに必要な３次元オブジェクトの全プロパティを取得
        var property = this.objects[i].getProperty();

        //３次元オブジェクトのクラス名を取得
        property.className = this.objects[i].getClassName();

        //３次元オブジェクトのプロパティ配列に格納
        data.objects.push(property);

    }

    return data;
}

//JSON形式の保存データを準備
PHYSICS.PhysLab.prototype.makeJSONSaveData = function () {

    if (!this.makeSaveDataFlag) return;
    if (!this.saveDataDownloadButtonID) return;

    this.breforeMakeJSONSaveData();

    //保存用データ取得
    var object = this.getSaveData();

    // Blobオブジェクトの生成
    var blob = new Blob(
        [PHYSICS.objectToJSON(object)],
        {"type": "text/plain"}
    );

    document.getElementById(this.saveDataDownloadButtonID).href = window.URL.createObjectURL(blob);
    document.getElementById(this.saveDataDownloadButtonID).download = "saveData.data";

    this.makeSaveDataFlag = false;

    this.afterMakeJSONSaveData();

}

////////////////////////////////////////////////////////////////////
// 復元データの読み込み
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.loadJSONSaveData = function (filePath) {

    //復元ファイルのパス
    this.loadFilePath = filePath;

    // XMLHttpRequestオブジェクトの生成
    var xmlHttp = new XMLHttpRequest();

    //同期通信によるデータの読み込み
    xmlHttp.open("GET", this.loadFilePath, false);
    xmlHttp.send(null);

    //読み込み後のデータ
    this.loadData = PHYSICS.JSONToObject(xmlHttp.responseText);

}

PHYSICS.PhysLab.prototype.restorePhysObjectsFromLoadData = function () {

    //読み込みデータがある場合
    if (this.loadData) {

        for (var i = 0; i < this.loadData.objects.length; i++) {

            var property = this.loadData.objects[i];
            var className = property.className;

            this.objects.push(new PHYSICS[className](property));

        }

    }

}


////////////////////////////////////////////////////////////////////
// 仮想物理実験のスタート関数
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.startLab = function () {
    //実験室番号
    PHYSICS.PhysLab.id++;
    this.id = PHYSICS.PhysLab.id;

    //イベント初期化メソッドの実行
    this.initEvent();

    //仮想物理実験室の初期化メソッドの実行
    this.init3DCG();

    //オブジェクトの生成と表示
    for (var i = 0; i < this.objects.length; i++) {

        //３次元オブジェクトを生成
        this.createPhysObject(this.objects[i]);

    }

    //時間制御スライダー利用時
    if (this.timeslider.enabled) {

        //全てのオブジェクトの時系列データを取得
        this.recordData = true;

    }

    this.afterStartLab();

    //無限ループ関数の実行
    this.loop();
}

PHYSICS.PhysLab.prototype.createPhysObject = function (physObject) {

    //３次元オブジェクトに所属する仮想物理実験オブジェクトを格納
    physObject.physLab = this;

    //非同期生成中の場合はスキップ
    if (physObject.asynchronous) return;

    //３次元オブジェクトの生成と表示
    physObject.create();

    //衝突判定を行うオブジェクトとして登録する
    if (physObject.collision) {

        this.collisionDetectionObjects.push(physObject);

    }

    //ドラック可能オブジェクトとして登録
    if (physObject.draggable) {

        this.draggableObjects.push(physObject.boundingBox.CG);

    }

}

////////////////////////////////////////////////////////////////////
// イベント準備関数
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.initEvent = function () {

    this.beforeInitEvent();

    var scope = this;

    //FPS計測結果を表示するHTML要素を追加
    if (this.displayFPS) {

        //FPS計測
        this.stats = new Stats();

        //HTML要素の追加
        document.getElementById(scope.frameID).appendChild(this.stats.domElement);

    }


    //計算開始ボタン・一時停止ボタンのクリックイベントの追加
    if (scope.playButtonID) {

        //jQueryの利用
        if (this.useJQuery) {

            $("#" + this.playButtonID).button({
                text: false,
                label: "計算開始",
                icons: {
                    primary: "ui-icon-play"
                }
            }).click(function () {

                //初期状態フラグの解除
                scope.initFlag = false;
                //一時停止フラグの反転
                scope.pauseFlag = !scope.pauseFlag;

                //動画準備完了フラグの解除
                scope.video.readyFlag = false;

                //ボタンの表示内容の変更
                scope.switchButton();

            });

        } else {

            //ボタンの表示内容を指定
            document.getElementById(scope.playButtonID).innerHTML = "計算開始";
            //マウスクリックイベントの追加
            document.getElementById(scope.playButtonID).addEventListener('mousedown', function () {

                //初期状態フラグの解除
                scope.initFlag = false;
                //一時停止フラグの反転
                scope.pauseFlag = !scope.pauseFlag;

                //動画準備完了フラグの解除
                scope.video.readyFlag = false;


                //ボタンの表示内容の変更
                scope.switchButton();


            }, false);

        }

    } else {

        //初期状態フラグの解除
        scope.initFlag = false;
        //一時停止の解除
        scope.pauseFlag = false;

    }


    //リセットボタンのクリックイベントの追加
    if (scope.resetButtonID) {

        //jQueryの利用
        if (this.useJQuery) {

            $("#" + this.resetButtonID).button({
                text: false,
                label: "初期状態へ戻る",
                icons: {
                    primary: "ui-icon-stop"
                }

            }).click(function () {

                //再計算用フラグを設定
                scope.resetFlag = true;
                //一時停止
                scope.pauseFlag = true;
                //動画準備完了フラグの解除
                scope.video.readyFlag = false;

                //表示するボタンの変更
                scope.switchButton();

            });

        } else {

            document.getElementById(scope.resetButtonID).innerHTML = "初期状態へ戻る";

            document.getElementById(scope.resetButtonID).addEventListener('mousedown', function () {

                //再計算用フラグを立てる
                scope.resetFlag = true;
                //一時停止を立てる
                scope.pauseFlag = true;

                //動画準備完了フラグの開所
                scope.video.readyFlag = false;

                //表示するボタンの変更
                scope.switchButton();


            }, false);

        }

    }

    //保存データダウンロードボタン
    if (scope.saveDataDownloadButtonID) {

        //jQueryの利用
        if (this.useJQuery) {

            $("#" + scope.saveDataDownloadButtonID).button({
                label: "実験室データのダウンロード",
                text: false,
                icons: {
                    primary: "ui-icon-disk"
                }

            })


        } else {

            document.getElementById(scope.saveDataDownloadButtonID).innerHTML = "実験室データのダウンロード";

        }

    }


    //動画生成
    if (scope.video.enabled) {

        //jQueryの利用
        if (this.useJQuery) {

            $("#" + scope.video.makeButtonID).button({
                label: "動画の生成",
                text: false,
                icons: {
                    primary: "ui-icon-video"
                }
            }).click(function () {

                //動画生成開始フラグを設定
                scope.video.makeStartFlag = true;
                //ボタンの表示内容の変更
                scope.switchButton();

            });

            $("#" + scope.video.downloadButtonID).button({
                label: "動画のダウンロード",
                text: false,
                icons: {
                    primary: "ui-icon-arrowthick-1-s"
                }
            })


        } else {

            document.getElementById(scope.video.makeButtonID).innerHTML = "動画の生成";
            document.getElementById(scope.video.makeButtonID).addEventListener('mousedown', function () {

                //動画生成開始フラグを設定
                scope.video.makeStartFlag = true;
                //ボタンの表示内容の変更
                scope.switchButton();

            });

            document.getElementById(scope.video.downloadButtonID).innerHTML = "動画のダウンロード";

        }

        //動画オブジェクトの生成
        scope.video.CG = new Whammy.Video(scope.video.speed, scope.video.quality);

    }


    //画面キャプチャ
    if (scope.pictureID) {

        //jQueryの利用
        if (this.useJQuery) {

            $("#" + scope.pictureID).button({
                label: "画面キャプチャ",
                text: false,
                icons: {
                    primary: "ui-icon-image"
                }

            });


        } else {

            document.getElementById(scope.pictureID).innerHTML = "画面キャプチャ";

        }

    }

    //時間制御スライダー
    if (this.timeslider.enabled) {

        document.getElementById(this.timeslider.domID).min = 0;
        document.getElementById(this.timeslider.domID).max = parseInt(this.step / this.timeslider.skipRecord);
        document.getElementById(this.timeslider.domID).value = ( this.timeslider.m !== undefined ) ? this.timeslider.m : parseInt(this.step / this.timeslider.skipRecord);
        document.getElementById(this.timeslider.domID).step = 1;

        document.getElementById(this.timeslider.domID).addEventListener('change', function () {
            //画面キャプチャの生成
            scope.makePictureFlag = true;
            scope.makeSaveDataFlag = true;

        }, false);

    }

    function setRadioButton(scope, name) {

        //id名
        var idName = name + "ButtonID";
        //フラグ名
        var flagName = name + "Flag";

        var domlist = document.getElementsByName(scope[idName]);

        /////////////////////////////////////////
        //初期値の設定

        var flag_str;
        if (scope[flagName] == true) {

            flag_str = "true";

        } else if (scope[flagName] == false) {

            flag_str = "false";

        } else {

            flag_str = scope[flagName];
        }

        //初期状態と同じvalue値のinputをチェック状態にする
        for (var i = 0; i < domlist.length; i++) {

            if (domlist[i].value == flag_str) domlist[i].checked = true;

        }

        //jQuery利用の有無
        if (scope.useJQuery) {

            $("#" + scope[idName]).buttonset().click(function () {

                //ラジオボタンのvalue値の取得
                scope[flagName] = $("#" + scope[idName] + " input:radio[name=" + scope[idName] + "]:checked").val();

                if (scope[flagName] == "true") scope[flagName] = true;
                else if (scope[flagName] == "false")  scope[flagName] = false;

                scope.makePictureFlag = true;
                scope.makeSaveDataFlag = true;

            });

        } else {

            document.getElementById(scope[idName]).addEventListener('click', function () {

                for (var i = 0; i < domlist.length; i++) {

                    if (domlist[i].checked) {

                        scope[flagName] = domlist[i].value;

                        if (scope[flagName] == "true") scope[flagName] = true;
                        else if (scope[flagName] == "false") scope[flagName] = false;

                        break;
                    }

                }

                scope.makePictureFlag = true;
                scope.makeSaveDataFlag = true;

            }, false);

        }

    }

    //速度ベクトル
    if (scope.velocityVectorButtonID) {
        setRadioButton(scope, "velocityVector");
    }

    //軌跡の描画
    if (scope.locusButtonID) {
        setRadioButton(scope, "locus");
    }

    //ストロボオブジェクトの表示
    if (scope.strobeButtonID) {
        setRadioButton(scope, "strobe");

    }

    this.switchButton();

    this.afterInitEvent();

}
////////////////////////////////////////////////////////////////////
// ボタン表示の変更関数
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.switchButton = function () {

    //一時停止フラグによる分岐
    if (this.pauseFlag) {

        var label = ( this.resetFlag ) ? "計算開始" : "計算再開";

        //jQueryの利用
        if (this.useJQuery) {

            $("#" + this.playButtonID).button(
                "option", {
                    label: label,
                    icons: {primary: "ui-icon-play"}
                }
            );

            $("#" + this.pictureID).css('display', 'inline-block');

            $("#" + this.saveDataDownloadButtonID).css('display', 'inline-block');

            //動画生成ボタンの表示・非表示
            if (!this.initFlag && !this.video.readyFlag) $("#" + this.video.makeButtonID).css('display', 'inline-block');
            else $("#" + this.video.makeButtonID).css('display', 'none');

            //動画ダウンロードボタンの表示・非表示
            if (this.video.readyFlag) $("#" + this.video.downloadButtonID).css('display', 'inline-block');
            else $("#" + this.video.downloadButtonID).css('display', 'none');

        } else {

            if (this.playButtonID)             document.getElementById(this.playButtonID).innerHTML = label;
            if (this.pictureID)                document.getElementById(this.pictureID).style.display = 'inline-block';
            if (this.saveDataDownloadButtonID) document.getElementById(this.saveDataDownloadButtonID).style.display = 'inline-block';


            //動画生成ボタンの表示
            if (!this.initFlag && !this.video.readyFlag && this.video.makeButtonID) document.getElementById(this.video.makeButtonID).style.display = 'inline-block';
            else if (this.video.makeButtonID) document.getElementById(this.video.makeButtonID).style.display = 'inline-block';

            //動画生成ボタンの表示
            if (this.video.readyFlag && this.video.downloadButtonID) document.getElementById(this.video.downloadButtonID).style.display = 'inline-block';
            else if (this.video.downloadButtonID) document.getElementById(this.video.downloadButtonID).style.display = 'inline-block';


        }

    } else {

        var label = "一時停止";

        //jQueryの利用
        if (this.useJQuery) {
            $("#" + this.playButtonID).button(
                "option", {
                    label: label,
                    icons: {primary: "ui-icon-pause"}
                }
            );

            $("#" + this.pictureID).css('display', 'none');

            $("#" + this.saveDataDownloadButtonID).css('display', 'none');

            //動画生成ボタンの表示・非表示
            if (this.video.makingFlag) $("#" + this.video.makeButtonID).css('display', 'inline-block');
            else $("#" + this.video.makeButtonID).css('display', 'none');

            //動画ダウンロードボタンの表示・非表示
            $("#" + this.video.downloadButtonID).css('display', 'none');

        } else {

            if (this.playButtonID)             document.getElementById(this.playButtonID).innerHTML = label;
            if (this.pictureID)                document.getElementById(this.pictureID).style.display = "none";
            if (this.saveDataDownloadButtonID) document.getElementById(this.saveDataDownloadButtonID).style.display = "none";

            //動画生成ボタンの表示
            if (this.video.makingFlag && this.video.makeButtonID) document.getElementById(this.video.makeButtonID).style.display = "inline-block";
            else if (this.video.makeButtonID) document.getElementById(this.video.makeButtonID).style.display = "none";

            //動画生成ボタンの表示
            if (this.video.downloadButtonID) document.getElementById(this.video.downloadButtonID).style.display = "none";

        }

        if (this.playback.checkID) {

            //チェックボックスを解除
            document.getElementById(this.playback.checkID).checked = false;

        }

    }

    //画面キャプチャの生成フラグ
    this.makePictureFlag = true;
    this.makeSaveDataFlag = true;

}


////////////////////////////////////////////////////////////////////
// 仮想物理実験室の初期化
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.init3DCG = function () {

    this.beforeInit3DCG();

    this.initThree();  //three.js初期化関数の実行
    this.initCamera(); //カメラ初期化関数の実行
    this.initLight();  //光源初期化関数の実行
    this.initDragg();  //マウスドラック準備関数の実行

    this.afterInit3DCG();
}

////////////////////////////////////////////////////////////////////
// Three.js初期化関数の定義
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.initThree = function () {

    //キャンバスフレームDOM要素の取得
    this.CG.canvasFrame = document.getElementById(this.frameID);

    //レンダラーオブジェクトの生成
    this.CG.renderer = new THREE.WebGLRenderer(this.renderer.parameters);

    if (!this.CG.renderer) alert('Three.js の初期化に失敗しました');

    //レンダラーのサイズの設定
    this.CG.renderer.setSize(
        this.CG.canvasFrame.clientWidth,
        this.CG.canvasFrame.clientHeight
    );

    //キャンバスフレームDOM要素にcanvas要素を追加
    this.CG.canvasFrame.appendChild(this.CG.renderer.domElement);

    //レンダラークリアーカラーの設定
    this.CG.renderer.setClearColor(
        this.renderer.clearColor,
        this.renderer.clearAlpha
    );

    //シャドーマップの利用
    this.CG.renderer.shadowMapEnabled = this.shadow.shadowMapEnabled;

    //シーンオブジェクトの生成
    this.CG.scene = new THREE.Scene();

    //スカイボックスの設定
    if (this.skybox.enabled) {
        //形状オブジェクトの宣言と生成
        var geometry = new THREE.BoxGeometry(this.skybox.size, this.skybox.size, this.skybox.size);
        //テクスチャの読み込み
        var textureCube = THREE.ImageUtils.loadTextureCube(this.skybox.cubeMapTexture, new THREE.CubeReflectionMapping());
        //画像データのフォーマットの指定
        textureCube.format = THREE.RGBFormat;
        //スカイボックス用シェーダー
        var shader = THREE.ShaderLib["cube"];
        shader.uniforms["tCube"].value = textureCube;
        //材質オブジェクト
        var material = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });
        //スカイボックスの生成
        this.CG.skybox = new THREE.Mesh(geometry, material);
        this.CG.skybox.position.set(this.skybox.r.x, this.skybox.r.y, this.skybox.r.z);
        this.CG.scene.add(this.CG.skybox);
    }

    //スカイドームの利用
    if (this.skydome.enabled) {

        var vertexShader = "//バーテックスシェーダー\n" +
            "//頂点シェーダーからフラグメントシェーダーへの転送する変数\n" +
            "varying vec3 vWorldPosition;\n" +
            "void main( ) {\n" +
            "	//ワールド座標系における頂点座標\n" +
            "	vec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n" +
            "	vWorldPosition = worldPosition.xyz;\n" +
            "	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n" +
            "}\n";

        var fragmentShader = "//フラグメントシェーダ―\n" +
            "//カスタムuniform変数の取得\n" +
            "uniform vec3 topColor;     //ドーム頂点色\n" +
            "uniform vec3 bottomColor;  //ドーム底辺色\n" +
            "uniform	float exp;         //減衰指数\n" +
            "uniform	float offset;      //高さ基準点\n" +
            "//バーテックスシェーダーから転送された変数\n" +
            "varying vec3 vWorldPosition;\n" +
            "void main( ) {\n" +
            "	//高さの取得\n" +
            "	float h = normalize( vWorldPosition + vec3(0, 0, offset) ).z;\n" +
            "	if( h < 0.0) h = 0.0;\n" +
            "	gl_FragColor = vec4( mix( bottomColor, topColor, pow(h, exp) ), 1.0 );\n" +
            "}\n";


        //形状オブジェクトの宣言と生成
        var geometry = new THREE.SphereGeometry(this.skydome.radius, 100, 100);
        var uniforms = {
            topColor: {type: "c", value: new THREE.Color().setHex(this.skydome.topColor)},
            bottomColor: {type: "c", value: new THREE.Color().setHex(this.skydome.bottomColor)},
            exp: {type: "f", value: this.skydome.exp},
            offset: {type: "f", value: this.skydome.offset}
        };
        //材質オブジェクトの宣言と生成
        var material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide,
            depthWrite: false
        });

        //スカイドームの生成		
        this.skydome.CG = new THREE.Mesh(geometry, material);
        this.CG.scene.add(this.skydome.CG);

    }

    //フォグの利用
    if (this.fog.enabled) {

        if (!this.fog.color) this.fog.color = this.renderer.clearColor;

        if (this.fog.type === "linear") {
            //線形フォグオブジェクトの生成
            this.CG.scene.fog = new THREE.Fog(
                this.fog.color, //フォグ色
                this.fog.near,  //フォグ開始距離
                this.fog.far    //フォグ終了距離
            );

        } else if (this.fog.type === "exp") {
            //指数フォグオブジェクトの生成
            this.CG.scene.fog = new THREE.FogExp2(
                this.fog.color,  //フォグ色
                this.fog.density //フォグの濃度（指数）
            );

        }
    }

}
////////////////////////////////////////////////////////////////////
// カメラ初期化関数の定義
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.initCamera = function () {

    //カメラのタイプが透視投影（Perspective）の場合
    if (this.camera.type == "Perspective") {

        //透視投影カメラオブジェクトの生成
        this.CG.camera = new THREE.PerspectiveCamera(
            this.camera.fov,  //視野角
            this.CG.canvasFrame.clientWidth / this.CG.canvasFrame.clientHeight, //アスペクト
            this.camera.near, //視体積手前までの距離
            this.camera.far   //視体積の奥までの距離
        );

        //カメラのタイプが正投影（Orthographic）の場合
    } else if (this.camera.type == "Orthographic") {

        //正投影カメラオブジェクトの生成
        this.CG.camera = new THREE.OrthographicCamera(
            this.camera.left,   //視体積の左までの距離
            this.camera.right,  //視体積の右までの距離
            this.camera.top,    //視体積の上までの距離
            this.camera.bottom, //視体積の下までの距離
            this.camera.near,   //視体積手前までの距離
            this.camera.far     //視体積の奥までの距離
        );

    } else {

        alert("カメラの設定ミス");

    }

    //カメラの位置の設定
    this.CG.camera.position.set(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z
    );
    //カメラの上ベクトルの設定
    this.CG.camera.up.set(
        this.camera.up.x,
        this.camera.up.y,
        this.camera.up.z
    );
    //カメラの中心位置ベクトルの設定（トラックボール利用時は自動的に無効）
    this.CG.camera.lookAt({
        x: this.camera.target.x,
        y: this.camera.target.y,
        z: this.camera.target.z
    });

    //トラックボールオブジェクトの宣言
    this.CG.trackball = new THREE.TrackballControls(
        this.CG.camera,
        this.CG.canvasFrame
    );

    //トラックボール動作範囲のサイズとオフセットの設定
    this.CG.trackball.screen.width = this.CG.canvasFrame.clientWidth;                        //横幅
    this.CG.trackball.screen.height = this.CG.canvasFrame.clientHeight;                      //縦幅
    this.CG.trackball.screen.offsetLeft = this.CG.canvasFrame.getBoundingClientRect().left;  //左オフセット
    this.CG.trackball.screen.offsetTop = this.CG.canvasFrame.getBoundingClientRect().top;    //上オフセット

    //トラックボールの回転無効化と回転速度の設定
    this.CG.trackball.noRotate = this.trackball.noRotate;
    this.CG.trackball.rotateSpeed = this.trackball.rotateSpeed;

    //トラックボールの拡大無効化と拡大速度の設定
    this.CG.trackball.noZoom = this.trackball.noZoom;
    this.CG.trackball.zoomSpeed = this.trackball.zoomSpeed;

    //トラックボールのカメラ中心移動の無効化と中心速度の設定
    this.CG.trackball.noPan = this.trackball.noPan;
    this.CG.trackball.panSpeed = this.trackball.panSpeed;
    this.CG.trackball.target = new THREE.Vector3(
        this.camera.target.x,
        this.camera.target.y,
        this.camera.target.z
    );

    //トラックボールのスタティックムーブの有効化
    this.CG.trackball.staticMoving = this.trackball.staticMoving;
    //トラックボールのダイナミックムーブ時の減衰定数
    this.CG.trackball.dynamicDampingFactor = this.trackball.dynamicDampingFactor;

    //トラックボール利用の有無
    this.CG.trackball.enabled = this.trackball.enabled;
}
////////////////////////////////////////////////////////////////////
// 光源初期化関数の定義
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.initLight = function () {

    //シャドーカメラのパラメータを設定する関数
    function setShadowCamera(shadowCamera, parameter) {
        //光源オブジェクトの影の生成元
        shadowCamera.castShadow = parameter.shadowMapEnabled;
        //シャドウマップのサイズ
        shadowCamera.shadowMapWidth = parameter.shadowMapWidth;
        shadowCamera.shadowMapHeight = parameter.shadowMapHeight;
        //影の黒さ
        shadowCamera.shadowDarkness = parameter.shadowDarkness;
        //シャドーカメラの可視化
        shadowCamera.shadowCameraVisible = parameter.shadowCameraVisible;

        if (shadowCamera instanceof THREE.DirectionalLight) {

            //平行光源の場合
            shadowCamera.shadowCameraNear = parameter.shadowCameraNear;
            shadowCamera.shadowCameraFar = parameter.shadowCameraFar;
            shadowCamera.shadowCameraRight = parameter.shadowCameraRight;
            shadowCamera.shadowCameraLeft = parameter.shadowCameraLeft;
            shadowCamera.shadowCameraTop = parameter.shadowCameraTop;
            shadowCamera.shadowCameraBottom = parameter.shadowCameraBottom;

        } else if (shadowCamera instanceof THREE.SpotLight) {

            //点光源の場合
            shadowCamera.shadowCameraNear = parameter.shadowCameraNear;
            shadowCamera.shadowCameraFar = parameter.shadowCameraFar;
            shadowCamera.shadowCameraFov = parameter.shadowCameraFov;

        } else {

            alert("シャドーカメラの設定ミス");

        }

    }


    if (this.light.type == "Directional") {

        //平行光源オブジェクトの生成
        this.CG.light = new THREE.DirectionalLight(
            this.light.color,     //光源色
            this.light.intensity  //光源強度
        );

        //シャドーマッピングを行う場合
        if (this.shadow.shadowMapEnabled) {

            setShadowCamera(this.CG.light, this.shadow);

        }

    } else if (this.light.type == "Spot") {

        //スポットライトオブジェクトの生成
        this.CG.light = new THREE.SpotLight(
            this.light.color,     //光源色
            this.light.intensity, //光源強度
            this.light.distance,  //距離減衰指数
            this.light.angle,     //スポットライト光源の角度
            this.light.exponent   //光軸からの減衰指数
        );

        //シャドーマッピングを行う場合
        if (this.shadow.shadowMapEnabled) {

            setShadowCamera(this.CG.light, this.shadow);

        }

    } else if (this.light.type == "Point") {
        //点光源オブジェクトの生成
        this.CG.light = new THREE.PointLight(
            this.light.color,     //光源色
            this.light.intensity, //光源強度
            this.light.distance   //距離減衰指数
        );

        //シャドーマッピングを行う場合
        if (this.shadow.shadowMapEnabled) {
            //シャドーカメラ用スポットライトオブジェクトの生成
            this.CG.light.shadowCamera = new THREE.SpotLight();
            //シャドーカメラ用の位置
            this.CG.light.shadowCamera.position.set(
                this.light.position.x,
                this.light.position.y,
                this.light.position.z
            );
            //スポットライト光源オブジェクトをシャドーマップ作成用のみに利用する
            this.CG.light.shadowCamera.onlyShadow = true;

            //シャドーカメラをシーンへ追加
            this.CG.scene.add(this.CG.light.shadowCamera);
            setShadowCamera(this.CG.light.shadowCamera, this.shadow);
        }

    } else {

        alert("光源の設定ミス");

    }

    //光源オブジェクトの位置の設定
    this.CG.light.position.set(
        this.light.position.x,
        this.light.position.y,
        this.light.position.z
    );
    //光源ターゲット用オブジェクトの生成
    this.CG.light.target = new THREE.Object3D();
    this.CG.light.target.position.set(
        this.light.target.x,
        this.light.target.y,
        this.light.target.z
    );
    //光源オブジェクトのシーンへの追加
    this.CG.scene.add(this.CG.light);


    if (this.light.ambient) {
        //環境光オブジェクトの生成
        this.CG.ambientLight = new THREE.AmbientLight(this.light.ambient);

        //環境光オブジェクトのシーンへの追加
        this.CG.scene.add(this.CG.ambientLight);
    }


    //レンズフレアの利用
    if (this.lensFlare.enabled) {
        //レンズフレアテクスチャ用画像の読み込み
        var flareTexture = THREE.ImageUtils.loadTexture(this.lensFlare.flareTexture);
        var ghostTexture = THREE.ImageUtils.loadTexture(this.lensFlare.ghostTexture);
        //フレアテクスチャの発光色
        var flareColor = new THREE.Color(this.lensFlare.flareColor);
        //レンズフレアオブジェクトの生成
        this.lensFlare.CG = new THREE.LensFlare(
            flareTexture,              //フレアテクスチャ
            this.lensFlare.flareSize,  //フレアサイズ
            0,                         //フレア距離
            THREE.AdditiveBlending,    //加算ブレンディングの指定
            flareColor                 //フレア発光色
        );
        //フレア位置の指定
        this.lensFlare.CG.position.copy(this.CG.light.position);

        //フレアの追加
        for (var i = 0; i < this.lensFlare.ghostList.length; i++) {
            this.lensFlare.CG.add(
                ghostTexture,                          //ゴーストテクスチャオブジェクト
                this.lensFlare.ghostList[i].size,      //ゴーストのサイズ
                this.lensFlare.ghostList[i].distance,  //ゴーストの発生距離
                THREE.AdditiveBlending                 //加算ブレンディングの指定
            );
        }

        //レンズフレアオブジェクトのシーンへの追加
        this.CG.scene.add(this.lensFlare.CG);

    }

}

////////////////////////////////////////////////////////////////////
// マウスドラック準備関数の定義
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.initDragg = function () {
    //仮想物理実験室全体でのマウスドラック無しの場合
    if (!this.draggable) return;

    ///////////////光線受信用平面オブジェクトの定義//////////////////
    //形状オブジェクトの宣言と生成
    var geometry = new THREE.PlaneGeometry(200, 200, 8, 8);
    //材質オブジェクトの宣言と生成
    var material = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true});
    //平面オブジェクトの生成
    var plane = new THREE.Mesh(geometry, material);
    //平面オブジェクトの可視化
    plane.visible = false;
    //平面オブジェクトのシーンへの追加
    this.CG.scene.add(plane);

    this.CG.canvasFrame.addEventListener('mousemove', onDocumentMouseMove, false);//
    this.CG.canvasFrame.addEventListener('mousedown', onDocumentMouseDown, true); //
    this.CG.canvasFrame.addEventListener('mouseup', onDocumentMouseUp, false);//
    this.CG.canvasFrame.addEventListener('mouseout', onDocumentMouseUp, false);  //

    //マウスクリック時のバウンディングボックスオブジェクト中心からの相対座標
    var offset = new THREE.Vector3();
    var INTERSECTED;  //マウスポインタが指しているオブジェクト 
    var SELECTED;     //マウスドラック中のオブジェクト
    var scope = this; //イベント中の実験室オブジェクトを指す変数

    //HTML要素の位置による補正量の取得
    var elementOffsetLeft, elementOffsetTop;

    //マウスムーヴイベント	
    function onDocumentMouseMove(event) {

        //マウスドラックフラグを解除
        for (var i = 0; i < scope.draggableObjects.length; i++) {
            scope.draggableObjects[i].physObject.boundingBox.draggFlag = false;
        }

        //マウスドラックが許可されていない場合は処理を終了
        if (!scope.allowDrag) return;

        elementOffsetLeft = scope.CG.canvasFrame.getBoundingClientRect().left;
        elementOffsetTop = scope.CG.canvasFrame.getBoundingClientRect().top;

        //マウスポインタの位置座標の取得
        var mx = ( (event.clientX - elementOffsetLeft) / scope.CG.canvasFrame.clientWidth) * 2 - 1;
        var my = -( (event.clientY - elementOffsetTop) / scope.CG.canvasFrame.clientHeight) * 2 + 1;
        var vector = new THREE.Vector3(mx, my, 0.5);
        //プロジェクターオブジェクトの生成
        var projector = new THREE.Projector();
        //逆投影変換を行うことで仮想空間内のベクトルへと変換する
        vector = projector.unprojectVector(vector, scope.CG.camera);
        //カメラ位置座標を起点として規格化を行う
        vector = vector.sub(scope.CG.camera.position).normalize();
        //カメラ位置座標から光線を発射
        var raycaster = new THREE.Raycaster(scope.CG.camera.position, vector);

        //オブジェクトがマウスドラックされている時
        if (SELECTED) {

            //光線と交わる平面オブジェクトオブジェクトを収集
            var intersects = raycaster.intersectObject(plane);
            //マウスドラック時のマウスポインタの指している平面オブジェクトの３次元空間中の位置座標
            var vec3 = intersects[0].point;

            //マウスドラックされているオブジェクトのバウンディングボックスを移動
            SELECTED.physObject.boundingBox.CG.position.copy(
                vec3.sub(offset)
            );

            //マウスドラックされているオブジェクトを移動
            SELECTED.physObject.r.copy(
                SELECTED.physObject.boundingBox.CG.position
            ).sub(SELECTED.physObject.boundingBox.center);

            //マウスドラックフラグの設定
            SELECTED.physObject.boundingBox.draggFlag = true;

            //衝突計算に必要な各種ベクトル量の更新を通知
            SELECTED.physObject.vectorsNeedsUpdate = true;

            //マウスドラックイベントの実行
            scope.mouseDraggEvent(SELECTED.physObject);

            return;
        }
        //光線と交わるオブジェクトを収集
        var intersects = raycaster.intersectObjects(scope.draggableObjects);

        //マウスポインタがオブジェクト上にある場合
        if (intersects.length > 0) {

            if (INTERSECTED != intersects[0].object) {

                //マウスドラックが許可されていない場合は処理を終了
                if (!intersects[0].object.physObject.allowDrag) return;

                //マウスポインタが指しているオブジェクトが登録されていなければ、一番手前のオブジェクトを「INTERSECTED」に登録
                INTERSECTED = intersects[0].object;

                //平面オブジェクトの位置座標を「INTERSECTED」に登録されたオブジェクトと同じ位置座標とする
                plane.position.copy(INTERSECTED.position);

                //平面オブジェクトの上ベクトルをカメラの位置座標の方向へ向ける
                plane.lookAt(scope.CG.camera.position);

            }
            //バウンディングボックスの可視化
            INTERSECTED.physObject.boundingBox.draggFlag = true;

            //マウスポインタのカーソルを変更
            scope.CG.canvasFrame.style.cursor = 'pointer';

        } else {

            //マウスポインタがオブジェクトから離れている場合
            INTERSECTED = null;

            //マウスポインタのカーソルを変更
            scope.CG.canvasFrame.style.cursor = 'auto';

        }
    }

    //マウスダウンイベント	
    function onDocumentMouseDown(event) {

        //マウスドラックが許可されていない場合は処理を終了
        if (!scope.allowDrag) return;

        //マウスポインタの位置座標の取得
        var mx = ( (event.clientX - elementOffsetLeft) / scope.CG.canvasFrame.clientWidth) * 2 - 1;
        var my = -( (event.clientY - elementOffsetTop) / scope.CG.canvasFrame.clientHeight) * 2 + 1;
        var vector = new THREE.Vector3(mx, my, 0.5);

        //プロジェクターオブジェクトの生成
        var projector = new THREE.Projector();
        //逆投影変換を行うことで仮想空間内のベクトルへと変換する
        vector = projector.unprojectVector(vector, scope.CG.camera);
        //カメラ位置座標を起点として規格化を行う
        vector = vector.sub(scope.CG.camera.position).normalize();
        //カメラ位置座標から光線を発射
        var raycaster = new THREE.Raycaster(scope.CG.camera.position, vector);
        //光線と交わるオブジェクトを収集
        var intersects = raycaster.intersectObjects(scope.draggableObjects);
        //交わるオブジェクトが１個以上の場合
        if (intersects.length > 0) {

            //マウスドラックが許可されていない場合は処理を終了
            if (!intersects[0].object.physObject.allowDrag) return;

            //トラックボールを無効化
            scope.CG.trackball.enabled = false;
            //クリックされたオブジェクトを「SELECTED」に登録
            SELECTED = intersects[0].object;

            //マウスダウンイベントの実行
            scope.mouseDownEvent(SELECTED.physObject);

            //光線と交わる平面オブジェクトオブジェクトを収集
            var intersects = raycaster.intersectObject(plane);
            //クリック時のマウスポインタの指した平面オブジェクトの３次元空間中の位置座標
            var vec3 = intersects[0].point;
            //平面オブジェクトの中心から見た相対的な位置座標
            offset.copy(vec3).sub(plane.position);
            //マウスポインタのカーソルを変更
            scope.CG.canvasFrame.style.cursor = 'move';
        }
    }

    //マウスアップイベント	
    function onDocumentMouseUp(event) {

        //マウスドラックフラグを解除
        for (var i = 0; i < scope.draggableObjects.length; i++) {
            scope.draggableObjects[i].physObject.boundingBox.draggFlag = false;
        }

        //トラックボールを有効化
        scope.CG.trackball.enabled = scope.trackball.enabled;

        //マウスポインタのカーソルを変更
        scope.CG.canvasFrame.style.cursor = 'auto';

        //画面キャプチャの生成フラグ
        scope.makePictureFlag = true;
        scope.makeSaveDataFlag = true;


        //マウスドラックが許可されていない場合は処理を終了
        if (!scope.allowDrag) return;

        //マウスアップ時にマウスポインタがオブジェクト上にある場合
        if (INTERSECTED && SELECTED) {

            //平面オブジェクトの位置座標をオブジェクトの位置座標に合わせる
            plane.position.copy(INTERSECTED.position);

            //内部パラメータのリセット
            if (SELECTED.physObject.dynamic || scope.initFlag) SELECTED.physObject.resetParameter();

            //マウスアップイベントの実行
            scope.mouseUpEvent(SELECTED.physObject);

            //マウスドラックの解除
            SELECTED = null;

        }

    }

}

////////////////////////////////////////////////////////////////////
// マウスドラック関連イベント
////////////////////////////////////////////////////////////////////
//３次元オブジェクトがマウスダウンされた時に実行
PHYSICS.PhysLab.prototype.mouseDownEvent = function (physObject) {

}
//３次元オブジェクトがマウスドラックされた時に実行
PHYSICS.PhysLab.prototype.mouseDraggEvent = function (physObject) {

}
//３次元オブジェクトがマウスアップされた時に実行
PHYSICS.PhysLab.prototype.mouseUpEvent = function (physObject) {

}

////////////////////////////////////////////////////////////////////
// 無限ループ関数の定義
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.loop = function () {

    this.beforeLoop();

    //トラックボールによるカメラオブジェクトのプロパティの更新
    this.CG.trackball.update();

    //FPT計測・表示
    if (this.stats) this.stats.update();

    //フラグチェック
    this.checkFlags();

    //実験室の時間発展の計算
    this.timeEvolution();

    //時間のコントロール
    this.timeControl();

    //３次元グラフィックスの更新
    for (var i = 0; i < this.objects.length; i++) {

        this.objects[i].update();

    }

    //レンダリング
    this.CG.renderer.render(this.CG.scene, this.CG.camera);

    //画面キャプチャの生成
    this.makePicture();

    //JSON型実験室データの生成
    this.makeJSONSaveData();

    //動画の生成
    this.makeVideo();

    this.afterLoop();

    //「loop( )」関数の呼び出し
    requestAnimationFrame(
        this.loop.bind(this)
    );
}


////////////////////////////////////////////////////////////////////
// 時間制御スライダーの実行
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.timeControl = function () {

    this.beforeTimeControl();

    //時刻の表示
    if (this.timeID) {
        var time = this.dt * this.step;
        document.getElementById(this.timeID).innerHTML = time.toFixed(2);
    }


    //時間制御スライダーの利用時
    if (this.timeslider.enabled) {

        if (this.pauseFlag && !this.initFlag) {

            //再生モード || 動画生成モード
            if (this.playback.enabled || this.video.enabled) {

                if (this.playback.enabled) {

                    if (this.playback.checkID) {

                        this.playback.on = document.getElementById(this.playback.checkID).checked;

                    } else {

                        this.playback.on = true;

                    }

                }

                if (this.video.makeStartFlag) {
                    //動画再生開始
                    document.getElementById(this.timeslider.domID).value = 0;

                    //動画生成フラグの設定
                    this.video.makingFlag = true;
                    //動画生成開始フラグを解除
                    this.video.makeStartFlag = false;

                } else if (this.playback.on || this.video.makingFlag) { //再生実行時あるいは動画生成状態

                    this.timeslider.m++;

                    var max = document.getElementById(this.timeslider.domID).max;

                    if (this.timeslider.m > max) {

                        if (this.playback.on) this.timeslider.m = 0;
                        else if (this.video.makingFlag) {

                            this.timeslider.m = max;

                            //動画生成中フラグの解除
                            this.video.makingFlag = false;

                            //動画生成完了フラグの設定
                            this.video.finishedFlag = true;

                        }

                    }

                    document.getElementById(this.timeslider.domID).value = this.timeslider.m;

                }


            }

            //スライダー値の取得
            this.timeslider.m = parseInt(document.getElementById(this.timeslider.domID).value);

            var m = this.timeslider.m;

            var time = m * this.timeslider.skipRecord * this.dt;

            //時刻の表示
            if (this.timeID) {
                document.getElementById(this.timeID).innerHTML = time.toFixed(2);
            }

            //時間発展状態から一時停止状態の場合
            if (!this.timeslider.save.flag) {
                for (var i = 0; i < this.objects.length; i++) {
                    this.timeslider.save.objects[i] = {}
                    this.timeslider.save.objects[i].r = this.objects[i].r.clone();
                    this.timeslider.save.objects[i].r_1 = this.objects[i].r_1.clone();
                    this.timeslider.save.objects[i].r_2 = this.objects[i].r_2.clone();
                    this.timeslider.save.objects[i].v = this.objects[i].v.clone();
                }
                //最新データの保持フラグを設定
                this.timeslider.save.flag = true;
            }

            //全ての３次元オブジェクト位置と速度を与える
            for (var i = 0; i < this.objects.length; i++) {

                if (this.objects[i].dynamic || this.objects[i].draggable) {

                    this.objects[i].r.x = this.objects[i].data.x[m][1];
                    this.objects[i].r.y = this.objects[i].data.y[m][1];
                    this.objects[i].r.z = this.objects[i].data.z[m][1];

                    this.objects[i].v.x = this.objects[i].data.vx[m][1];
                    this.objects[i].v.y = this.objects[i].data.vy[m][1];
                    this.objects[i].v.z = this.objects[i].data.vz[m][1];

                } else if (this.objects[i].hasOwnProperty("dynamicFunction")) {

                    this.objects[i].dynamicFunction(time);

                }

            }


        } else {

            document.getElementById(this.timeslider.domID).max = parseInt(this.step / this.timeslider.skipRecord);
            document.getElementById(this.timeslider.domID).value = parseInt(this.step / this.timeslider.skipRecord);

        }

    }

    //一時停止リストのチェック
    if (this.pauseStepList.indexOf(this.step) >= 0) {

        if (!this.pauseFlag) {
            //一時停止フラグ
            this.pauseFlag = true;

            this.switchButton();
        }
    }


    this.afterTimeControl();

}

//動画生成
PHYSICS.PhysLab.prototype.makeVideo = function () {

    if (!this.video.enabled) return;

    //動画生成中
    if (this.video.makingFlag) {

        //動画フレームの追加
        this.video.CG.add(this.CG.renderer.domElement);

    } else if (this.video.finishedFlag) {

        //BlobURLの生成
        document.getElementById(this.video.downloadButtonID).href = window.URL.createObjectURL(
            //動画Blobオブジェクトの生成
            this.video.CG.compile()
        );

        //動画ファイル名の指定
        document.getElementById(this.video.downloadButtonID).download = this.video.fileName;

        //動画生成完了フラグの解除
        this.video.finishedFlag = false;
        //動画準備完了フラグの設定
        this.video.readyFlag = true;

        this.switchButton();

        //動画フレームの初期化
        this.video.CG.frames = [];

    }

}


////////////////////////////////////////////////////////////////////
// 停止フラグのチェック
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.checkFlags = function () {

    this.beforeCheckFlags();

    //リセットフラグ
    if (this.resetFlag) {

        for (var i = 0; i < this.objects.length; i++) {

            if (this.objects[i].data.x.length == 0) continue;

            this.objects[i].r.x = this.objects[i].data.x[0][1];
            this.objects[i].r.y = this.objects[i].data.y[0][1];
            this.objects[i].r.z = this.objects[i].data.z[0][1];

            this.objects[i].v.x = this.objects[i].data.vx[0][1];
            this.objects[i].v.y = this.objects[i].data.vy[0][1];
            this.objects[i].v.z = this.objects[i].data.vz[0][1];

            this.objects[i].allowDrag = this.objects[i].draggable;
            this.objects[i].step = 0;

            this.objects[i].vectorsNeedsUpdate = true;

        }

        for (var i = 0; i < this.objects.length; i++) {
            //内部データの初期化
            this.objects[i].resetParameter();
        }

        //停止フラグの解除
        this.resetFlag = false;
        //一時停止フラグを立てる
        this.pauseFlag = true;
        //画面キャプチャの生成フラグ
        this.makePictureFlag = true;
        this.makeSaveDataFlag = true;

        //初期フラグを立てる
        this.initFlag = true;

        //各種計算パラメータの初期化
        this.step = 0;
        //実験室のマウスドラックを規定値へ
        this.allowDrag = this.draggable;

        //時間制御スライダー利用時
        if (this.timeslider.enabled) {
            //最新データフラグの解除
            this.timeslider.save.flag = false;
            this.timeslider.m = 0;
        }

    }

    //一時停止解除（最新データの保持）
    if (!this.pauseFlag && this.timeslider.save.flag) {

        //全ての３次元オブジェクトを最新データを再設定
        for (var i = 0; i < this.objects.length; i++) {

            this.objects[i].r.copy(this.timeslider.save.objects[i].r);
            this.objects[i].r_1.copy(this.timeslider.save.objects[i].r_1);
            this.objects[i].r_2.copy(this.timeslider.save.objects[i].r_2);
            this.objects[i].v.copy(this.timeslider.save.objects[i].v);

        }

        //最新データフラグの解除
        this.timeslider.save.flag = false;
    }

    this.afterCheckFlags();
}


////////////////////////////////////////////////////////////////////
// 実験室の時間発展
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.timeEvolution = function () {

    this.breforeTimeEvolution();

    //一時停止中の場合
    if (this.pauseFlag) return;

    //描画の間引回数だけ時間発展を進める
    for (var i = 0; i < this.skipRendering; i++) {
        //実験室オブジェクトのステップ数のインクリメント
        this.step++;

        for (var j = 0; j < this.objects.length; j++) {

            if (!this.objects[j].dynamic) {

                //内部時間の同期
                for (var k = this.objects[j].step; k <= this.step; k++) {
                    //内部時間ステップのインクリメント
                    this.objects[j].step++;
                    //動的関数の実行
                    this.objects[j].dynamicFunction();
                    //各種ベクトルの計算
                    this.objects[j].computeVectors();
                    //運動の記録
                    this.objects[j].recordDynamicData();
                }

                continue;
            }

            //運動中はマウスドラックを禁止する
            this.objects[j].allowDrag = false;

            //内部時間の同期
            for (var k = this.objects[j].step; k <= this.step; k++) {


                //接触検知
                this.checkContact();

                //オブジェクトの時間発展
                this.objects[j].timeEvolution();

                //衝突判定メソッドの実行
                this.checkCollision();

                //衝突による時間発展
                this.objects[j].timeEvolutionOfCollision();

                //衝突力の初期化
                this.objects[j].collisionForce = 0;

                //接触力の初期化
                this.objects[j].contactForce = 0;


            }

        }

        this.centerTimeEvolution();


    }

    this.afterTimeEvolution();
}


////////////////////////////////////////////////////////////////////
// 画面キャプチャの生成
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.makePicture = function () {

    //画面キャプチャ生成フラグのチェック
    if (!this.makePictureFlag) return;

    this.breforeMakePicture();

    if (this.pictureID) {

        //canvas要素→DataURL形式
        document.getElementById(this.pictureID).href = this.CG.renderer.domElement.toDataURL("image/png");

        var time = ( this.timeslider.m !== undefined ) ? this.timeslider.m * this.timeslider.skipRecord * this.dt : this.step * this.dt;

        //PNGファイル名の命名
        document.getElementById(this.pictureID).download = time.toFixed(2) + ".png";

    }
    //画面キャプチャ生成フラグの解除
    this.makePictureFlag = false;

    this.afterMakePicture();

}

////////////////////////////////////////////////////////////////////
// ダウンロードデータの生成
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.makeDownloadData = function (column, ID, fileName) {
    //データ列
    column = column || [];

    //出力内容の用意
    var outputs = [];
    for (var i = 0; i < column[0].length; i++) {

        var data = column[0][i][0]; //時刻

        for (var j = 0; j < column.length; j++) {
            data += "\t" + column[j][i][1];
        }

        data += "\n";

        outputs.push(data);
    }

    // Blobオブジェクトの生成
    var blob = new Blob(outputs, {"type": "text/plain"});

    document.getElementById(ID).href = window.URL.createObjectURL(blob);
    document.getElementById(ID).download = fileName;

}


////////////////////////////////////////////////////////////////////
// 通信メソッドの定義
////////////////////////////////////////////////////////////////////
//initEventメソッド
PHYSICS.PhysLab.prototype.beforeInitEvent = function () {
    for (var i = 0; i < this.beforeInitEventFunctions.length; i++) {
        this.beforeInitEventFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterInitEvent = function () {
    for (var i = 0; i < this.afterInitEventFunctions.length; i++) {
        this.afterInitEventFunctions[i]();
    }
}
//init3DCGメソッド
PHYSICS.PhysLab.prototype.beforeInit3DCG = function () {
    for (var i = 0; i < this.beforeInit3DCGFunctions.length; i++) {
        this.beforeInit3DCGFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterInit3DCG = function () {
    for (var i = 0; i < this.afterInit3DCGFunctions.length; i++) {
        this.afterInit3DCGFunctions[i]();
    }
}

PHYSICS.PhysLab.prototype.afterStartLab = function () {
    for (var i = 0; i < this.afterStartLabFunctions.length; i++) {
        this.afterStartLabFunctions[i]();
    }
}


//timeControlメソッド
PHYSICS.PhysLab.prototype.beforeTimeControl = function () {
    for (var i = 0; i < this.beforeTimeControlFunctions.length; i++) {
        this.beforeTimeControlFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.centerTimeEvolution = function () {
    for (var i = 0; i < this.centerTimeEvolutionFunctions.length; i++) {
        this.centerTimeEvolutionFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterTimeControl = function () {
    for (var i = 0; i < this.afterTimeControlFunctions.length; i++) {
        this.afterTimeControlFunctions[i]();
    }
}
//checkFlagsメソッド
PHYSICS.PhysLab.prototype.beforeCheckFlags = function () {
    for (var i = 0; i < this.beforeCheckFlagsFunctions.length; i++) {
        this.beforeCheckFlagsFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterCheckFlags = function () {
    for (var i = 0; i < this.afterCheckFlagsFunctions.length; i++) {
        this.afterCheckFlagsFunctions[i]();
    }
}
//timeEvolutionメソッド
PHYSICS.PhysLab.prototype.breforeTimeEvolution = function () {
    for (var i = 0; i < this.breforeTimeEvolutionFunctions.length; i++) {
        this.breforeTimeEvolutionFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterTimeEvolution = function () {
    for (var i = 0; i < this.afterTimeEvolutionFunctions.length; i++) {
        this.afterTimeEvolutionFunctions[i]();
    }
}
//makePictureメソッド
PHYSICS.PhysLab.prototype.breforeMakePicture = function () {
    for (var i = 0; i < this.breforeMakePictureFunctions.length; i++) {
        this.breforeMakePictureFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterMakePicture = function () {
    for (var i = 0; i < this.afterMakePictureFunctions.length; i++) {
        this.afterMakePictureFunctions[i]();
    }
}
//makeJSONSaveDataメソッド
PHYSICS.PhysLab.prototype.breforeMakeJSONSaveData = function () {
    if (this.breforeMakeJSONSaveDataFunctions === undefined) return;
    for (var i = 0; i < this.breforeMakeJSONSaveDataFunctions.length; i++) {
        this.breforeMakeJSONSaveDataFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterMakeJSONSaveData = function () {
    for (var i = 0; i < this.afterMakeJSONSaveDataFunctions.length; i++) {
        this.afterMakeJSONSaveDataFunctions[i]();
    }
}

//loopメソッド
PHYSICS.PhysLab.prototype.beforeLoop = function () {
    for (var i = 0; i < this.beforeLoopFunctions.length; i++) {
        this.beforeLoopFunctions[i]();
    }
}
PHYSICS.PhysLab.prototype.afterLoop = function () {
    for (var i = 0; i < this.afterLoopFunctions.length; i++) {
        this.afterLoopFunctions[i]();
    }
}

////////////////////////////////////////////////////////////////////
// オブジェクト同士の衝突検知
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.checkCollision = function (contact) {

    //衝突判定を行うオブジェクト数の取得
    var length = this.collisionDetectionObjects.length;
    for (var i = 0; i < length; i++) {
        //オブジェクト１の取得
        var object1 = this.collisionDetectionObjects[i];

        for (var j = i + 1; j < length; j++) {
            //オブジェクト２の取得
            var object2 = this.collisionDetectionObjects[j];

            //オブジェクトのどちらかが時間発展する
            if (object1.dynamic || object2.dynamic) {

                var flag = false;
                for (var k1 = 0; k1 < object1.collisionGroups.length; k1++) {

                    for (var k2 = 0; k2 < object2.collisionGroups.length; k2++) {

                        if (object1.collisionGroups[k1] == object2.collisionGroups[k2]) flag = true;
                    }

                }
                //衝突の可能性が無い場合は次へ
                if (object1.collisionGroups.length != 0 && object2.collisionGroups.length != 0 && !flag) continue;

                //バウンディング球による衝突可能性の判定
                if (this.checkPossibilityOfCollision(object1, object2)) {

                    //運動する球オブジェクトと衝突対象のオブジェクトの判別
                    if (object1.dynamic && object1 instanceof PHYSICS.Sphere) {
                        var sphere = object1;
                        var object = object2;
                    } else if (object2.dynamic && object2 instanceof PHYSICS.Sphere) {
                        var sphere = object2;
                        var object = object1;
                    }

                    if (object instanceof PHYSICS.Sphere)
                    //球オブジェクト vs 球オブジェクト
                        this.checkCollisionSphereVsSphere(sphere, object);
                    else if (object instanceof PHYSICS.Plane)
                    //球オブジェクト vs 平面オブジェクト
                        this.checkCollisionSphereVsPlane(sphere, object);
                    else if (object instanceof PHYSICS.Cylinder)
                    //球オブジェクト vs 円柱オブジェクト
                        this.checkCollisionSphereVsCylinder(sphere, object);
                    else if (object instanceof PHYSICS.Line)
                    //球オブジェクト vs 線オブジェクト
                        this.checkCollisionSphereVsLine(sphere, object);
                }
            }
        }
    }
    for (var i = 0; i < length; i++) {

        var object = this.collisionDetectionObjects[i];

        if (object.collisionObjects.length > 0) {

            if (object.dynamic) {

                var history = {};
                history.step = this.step;

                if (contact) {
                    //接触判定の場合
                    object.contactForce = object.getContactForce();

                    history.type = "contact";
                    history.force = object.contactForce.clone();

                } else {
                    //衝突判定の場合
                    object.collisionForce = object.getCollisionForce();

                    history.type = "collision";
                    history.force = object.collisionForce.clone();
                }

                history.objects = [];

                for (var i = 0; i < object.collisionObjects.length; i++) {
                    history.objects.push(object.collisionObjects[i]);
                }
                object.data.collisionHistory.push(history);

            }
            //衝突オブジェクトの初期化
            object.collisionObjects = [];
        }
    }
}
////////////////////////////////////////////////////////////////////
//接触判定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.checkContact = function () {
    this.checkCollision(true);
}
////////////////////////////////////////////////////////////////////
// バウンディング球による衝突可能性の判定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.checkPossibilityOfCollision = function (object1, object2) {
    //バウンディング球の半径の取得
    var l1 = object1.boundingSphere.radius;//
    var l2 = object2.boundingSphere.radius;//
    //グローバル座標系におけるバウンディング球の中心座標
    var r1 = new THREE.Vector3().copy(object1.r).add(object1.boundingSphere.center);
    var r2 = new THREE.Vector3().copy(object2.r).add(object2.boundingSphere.center);
    //中心座標間の距離の２乗
    var l = new THREE.Vector3().subVectors(r1, r2).lengthSq();
    return (l < (l1 + l2) * (l1 + l2) ) ? true : false;
}

////////////////////////////////////////////////////////////////////
// 球と平面領域の衝突
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.checkCollisionSphereVsPlane = function (sphere, object, noSide) {
    //端での衝突計算を無効化
    noSide = noSide || false;

    //衝突有無フラグ
    var flag = false;

    //平面との衝突
    for (var i = 0; i < object.faces.length; i++) {

        if (object instanceof PHYSICS.Polygon) {
            //バウンディング球の半径の取得
            var l1 = sphere.boundingSphere.radius;//
            var l2 = object.facesBoundingSphereRadius[i];//
            //グローバル座標系におけるバウンディング球の中心座標
            var r1 = new THREE.Vector3().copy(sphere.r).add(sphere.boundingSphere.center);
            var r2 = object.centerPosition[i];

            //中心座標間の距離の２乗
            var l = new THREE.Vector3().subVectors(r1, r2).lengthSq();

            if (l > (l1 + l2) * (l1 + l2)) continue;
        }

        //平面と点の距離
        var R = PHYSICS.Math.getDistanceBetweenPointAndPlane(
            object.normals[i],                         //面の法線ベクトル
            object.vertices[object.faces[i][0]],     //面が通過する点
            sphere.r                                   //距離を計算する位置座標
        );

        //平面との距離が球オブジェクトの半径未満の場合
        if (R < sphere.radius) {

            //Circleクラスを基底とするオブジェクト
            if (object.constructor === PHYSICS.Circle || object.constructor === PHYSICS.Cylinder) {

                //円オブジェクトとの衝突による衝突力の向き
                var dirR = this.getCollisionCircle(sphere, object, i, noSide);

            } else {
                //平面との衝突
                if (noSide) {
                    //平面領域のみ
                    var dirR = this.getCollisionPlane(sphere, object, i);  //平面領域での衝突（2.7節）
                } else {
                    //平面を構成する全ての可能性を検証	
                    var dirR = this.getCollisionPlane(sphere, object, i)  //平面領域での衝突（2.7節）
                        || this.getCollisionSide(sphere, object, i)   //平面の辺での衝突（2.9.2項）
                        || this.getCollisionEdge(sphere, object, i);  //平面の角での衝突（2.9.3項）
                }
            }

            if (dirR) {
                sphere.collisionObjects.push({object: object, dirR: dirR});
                return true;
            }
        }
    }
    return flag;
}

////////////////////////////////////////////////////////////////////
//任意の点から平面に下ろした垂線の位置ベクトルが平面内にあるかを判定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.getCollisionPlane = function (sphere, object, i) {

    //垂線の足ベクトル
    var A = PHYSICS.Math.getFootVectorOfPerpendicularFromPlane(
        object.normals[i],                        //面の法線ベクトル
        object.vertices[object.faces[i][0]],      //面が通過する点
        sphere.r                                  //距離を計算する位置座標
    );
    //平面内ベクトル
    var Q = new THREE.Vector3().subVectors(A, object.vertices[object.faces[i][0]]);

    //三角形の接線ベクトル
    var t1 = object.tangents[i][0];
    var t2 = object.tangents[i][1];

    //三角形の辺の長さの２乗
    var t1_lengthSq = t1.lengthSq();
    var t2_lengthSq = t2.lengthSq();

    //三角形の接線ベクトルとQとの内積
    var dot1 = Q.dot(t1);
    var dot2 = Q.dot(t2);

    //三角形の接線ベクトル同士の内積
    var dotT = t1.dot(t2)

    //係数の計算
    var a = ( dot1 * t2_lengthSq - dotT * dot2 ) / ( t1_lengthSq * t2_lengthSq - dotT * dotT );
    var b = ( dot2 * t1_lengthSq - dotT * dot1 ) / ( t1_lengthSq * t2_lengthSq - dotT * dotT );

    //平行四辺形との衝突条件
    if (a > 0 && b > 0 && a < 1 && b < 1) {

        //ポリゴンオブジェクトの場合
        if (object instanceof PHYSICS.Polygon) {

            if (a + b < 1) return false;

        }

        var R = new THREE.Vector3().subVectors(sphere.r, A);

        return R.normalize();

    } else {

        return false;

    }

}
////////////////////////////////////////////////////////////////////
//平面の辺での衝突を判定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.getCollisionSide = function (sphere, object, i) {

    //２つの頂点の線分と球オブジェクトとの衝突計算
    function getCollisionForceDirectionVector(sphere, V1, V2) {

        //垂線の足から頂点までのベクトル
        var R = PHYSICS.Math.getPerpendicularVectorFromLinear3(V1, V2, sphere.r);

        //点と線分までの距離の２乗
        var Rsq = R.lengthSq();
        if (Rsq < sphere.radius * sphere.radius) {

            //頂点間をつなぐベクトル
            var V = new THREE.Vector3().subVectors(V2, V1);
            //頂点間をつなぐベクトル
            var hatV = V.clone().normalize();
            //頂点間をつなぐベクトル
            var barR = new THREE.Vector3().subVectors(sphere.r, V1);

            //直線に下ろした垂線の足が線分の内側かを判定
            if (barR.dot(hatV) > 0 && barR.dot(hatV) < V.length()) {
                return R.normalize();
            }
        }

    }

    //平面との衝突
    if (object.faces.length) {

        //i番目の面を構成する全ての辺について評価する
        for (var j = 0; j < object.faces[i].length; j++) {
            var k = ( j < object.faces[i].length - 1 ) ? j + 1 : 0;

            //i番目の面を構成するj番目の頂点の頂点番号
            var n1 = object.faces[i][j];
            //i番目の面を構成するk番目の頂点の頂点番号
            var n2 = object.faces[i][k];

            //n1番目の頂点座標
            var V1 = object.vertices[n1];
            var V2 = object.vertices[n2];

            var dirR = getCollisionForceDirectionVector(sphere, V1, V2);

            if (dirR) return dirR;
        }

    } else {
        //Lineクラスの線分領域での衝突を想定

        //頂点数
        var vN = object.vertices.length;

        //線オブジェクトの線分での衝突計算
        for (var n = 0; n < vN - 1; n++) {

            //２点の頂点座標
            var V1 = object.vertices[n];
            var V2 = object.vertices[n + 1];

            var dirR = getCollisionForceDirectionVector(sphere, V1, V2);

            if (dirR) return dirR;
        }

    }

    return false;
};

////////////////////////////////////////////////////////////////////
//平面の角での衝突を判定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.getCollisionEdge = function (sphere, object, i) {

    //２つの頂点と球オブジェクトとの衝突計算
    function getCollisionForceDirectionVector(sphere, V) {

        //平面の角から球体中心に向かうベクトル
        var R = new THREE.Vector3().subVectors(
            sphere.r,                            //球の中心座標
            V  //角の座標
        );
        if (R.lengthSq() < sphere.radius * sphere.radius) {
            return R.normalize();
        }

    }

    //平面との衝突
    if (object.faces.length) {

        //i番目の面を構成する全ての角ついて評価する
        for (var j = 0; j < object.faces[i].length; j++) {

            var dirR = getCollisionForceDirectionVector(
                sphere,                               //球オブジェクト
                object.vertices[object.faces[i][j]] //頂点座標
            )
            if (dirR) return dirR;
        }

    } else {
        //Lineクラスの線分の角領域での衝突を想定

        //頂点数
        var vN = object.vertices.length;

        //頂点との衝突計算
        for (var n = 0; n < vN; n++) {

            var dirR = getCollisionForceDirectionVector(
                sphere,                               //球オブジェクト
                object.vertices[n] //角の座標
            )
            if (dirR) return dirR;

        }

    }

    return false;
}

////////////////////////////////////////////////////////////////////
// 球と線の衝突
////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.checkCollisionSphereVsLine = function (sphere, object) {

    //線分と角との衝突を検証	
    var dirR = this.getCollisionSide(sphere, object)  //線分の衝突（9.1.10項）
        || this.getCollisionEdge(sphere, object); //線の角での衝突（9.1.10項）

    if (dirR) {
        sphere.collisionObjects.push({object: object, dirR: dirR});
        return true;
    }

    return false;
}


////////////////////////////////////////////////////////////////////////////////////////////
//球と球の衝突の内部
////////////////////////////////////////////////////////////////////////////////////////////
PHYSICS.PhysLab.prototype.getCollisionSphere = function (positon1, radius1, positon2, radius2) {

    //球オブジェクトの相対ベクトル（2→1）
    var R = new THREE.Vector3().subVectors(positon1, positon2);

    if (R.lengthSq() < ( radius1 + radius2 ) * ( radius1 + radius2 )) {

        var dirR = R.normalize();

        return dirR;

    } else {

        return false;

    }

},

////////////////////////////////////////////////////////////////////////////////////////////
//球と球の衝突
////////////////////////////////////////////////////////////////////////////////////////////
    PHYSICS.PhysLab.prototype.checkCollisionSphereVsSphere = function (sphere, object) {

        var objectRadius = ( object.constructor === PHYSICS.Point ) ? 0 : object.radius;

        //衝突有無フラグ
        var flag = false;

        //球と球の衝突判定
        var dirR = this.getCollisionSphere(
            sphere.r,      //球オブジェクトの位置ベクトル
            sphere.radius, //球オブジェクトの半径
            object.r,      //衝突計算対象となるオブジェクトの位置ベクトル
            objectRadius   //衝突計算対象となるオブジェクトの半径
        );

        if (dirR) {
            sphere.collisionObjects.push({object: object, dirR: dirR});
            flag = true;
        }

        return flag;
    }

//円オブジェクトの衝突判定を行う
PHYSICS.PhysLab.prototype.getCollisionCircle = function (sphere, circle, i, noSide) {
    //円の端の衝突を考慮しない
    noSide = noSide || false;

    //円柱オブジェクトの場合radiusを上書きする
    if (circle.constructor === PHYSICS.Cylinder) circle.radius = (i == 0) ? circle.radiusTop : circle.radiusBottom;

    var r = sphere.r;
    var P = circle.centerPosition[i];

    //垂線の足の位置ベクトル
    var A = PHYSICS.Math.getFootVectorOfPerpendicularFromPlane(
        circle.normals[i], //面の法線ベクトル
        P,                 //面の通過する点
        r                  //球の位置ベクトル
    );
    //円の中心から垂線の足までのベクトル
    var Q = A.clone().sub(P);

    //円と球体との衝突判定による分岐
    if (Q.lengthSq() < circle.radius * circle.radius) { //円の平面領域での衝突条件

        //衝突力の方向ベクトル
        var R = new THREE.Vector3().subVectors(r, A);

        return R.normalize();

    } else if (!noSide && Q.lengthSq() < ( circle.radius + sphere.radius ) * ( circle.radius + sphere.radius )) {  //円の外周との衝突条件

        //円の中心から衝突点までのベクトル
        var V = Q.clone().multiplyScalar(circle.radius / Q.length());

        //衝突点から球の中心までのベクトル
        var S = r.clone().sub(P).sub(V);

        return S.normalize();

    }

    return false;
}
//球と円柱の衝突
PHYSICS.PhysLab.prototype.checkCollisionSphereVsCylinder = function (sphere, cylinder) {
    //衝突有無フラグ
    var flag = false;

    if (!cylinder.openEnded) {
        //円柱の上部・下部の円との衝突の検知
        flag = this.checkCollisionSphereVsPlane(sphere, cylinder, true);
        if (flag) return true;

    }

    //円柱オブジェクトの側面での反射を検討
    var dirR = this.getCollisionCylinderSide(sphere, cylinder);

    if (dirR) {

        sphere.collisionObjects.push({object: cylinder, dirR: dirR});

        return true;
    }
    return false;
}
//円柱の辺での衝突の判定
PHYSICS.PhysLab.prototype.getCollisionCylinderSide = function (sphere, cylinder) {

    var V1 = cylinder.centerPosition[0]; //上円の中心座標
    var V2 = cylinder.centerPosition[1]; //下円の中心座標

    //下円から上円の中心軸ベクトル
    var V = new THREE.Vector3().subVectors(V2, V1);

    //垂線の足から球の中心へのベクトル
    var R = PHYSICS.Math.getPerpendicularVectorFromLinear3(
        V1,      //直線の通過する点1
        V2,      //直線の通過する点2 
        sphere.r //球の位置ベクトル
    );

    //円の接線ベクトル
    var t = R.clone().normalize();
    //円柱の上円と下円の外周上の位置ベクトル
    var A1 = new THREE.Vector3().addVectors(V1, t.clone().multiplyScalar(cylinder.radiusTop));
    var A2 = new THREE.Vector3().addVectors(V2, t.clone().multiplyScalar(cylinder.radiusBottom));
    var A = new THREE.Vector3().subVectors(A2, A1);

    //上円の中心座標を基準とした球の位置ベクトル
    var rbar = new THREE.Vector3().subVectors(sphere.r, A1);
    var A_dot_rbar = A.dot(rbar);

    //垂線の足から球の中心へのベクトル
    var S = PHYSICS.Math.getPerpendicularVectorFromLinear3(
        A1,      //直線の通過する点1
        A2,      //直線の通過する点2 
        sphere.r //球の位置ベクトル
    );

    //円柱の側面での衝突判定
    if (S.lengthSq() < sphere.radius * sphere.radius) {

        //有限長の円柱との衝突
        if (A_dot_rbar > 0 && A_dot_rbar < A.lengthSq()) {

            //衝突力の方向
            return S.normalize();

        } else {
            //線分の外の場合、円柱の端での衝突を検証する

            var S1 = new THREE.Vector3().subVectors(sphere.r, A1);
            var S2 = new THREE.Vector3().subVectors(sphere.r, A2);

            if (S1.lengthSq() < sphere.radius * sphere.radius) {

                //円柱の上円側との衝突
                return S1.normalize();

            } else if (S2.lengthSq() < sphere.radius * sphere.radius) {

                //円柱の上円側との衝突
                return S2.normalize();

            }
        }
    }
    return false;
}
////////////////////////////////////////////////////////////////////////////////////////////////////


//衝突判定リストからの削除
PHYSICS.PhysLab.prototype.removeCollisionDetectionObjects = function (object) {

    var removeNum = false;
    for (var i = 0; i < this.collisionDetectionObjects.length; i++) {

        if (this.collisionDetectionObjects[i].id == object.id) removeNum = i;

    }
    if (removeNum !== false) {

        //衝突判定リストから該当オブジェクトを削除
        this.collisionDetectionObjects.splice(removeNum, 1);
        return true;

    } else {

        console.log("衝突判定リストに存在しません");
        return false;

    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//物理系に存在するオブジェクトの基底クラス
PHYSICS.PhysObject = function (parameter) {

    //位置ベクトル
    this.r = new THREE.Vector3();
    //速度ベクトル
    this.v = new THREE.Vector3();
    //加速度ベクトル
    this.a = new THREE.Vector3();

    //r_{n-1}
    this.r_1 = new THREE.Vector3();
    //r_{n-2}
    this.r_2 = new THREE.Vector3();
    //v_{n-1}
    this.v_1 = new THREE.Vector3();
    //v_{n-2}
    this.v_2 = new THREE.Vector3();

    //時間発展の有無
    this.dynamic = false;

    //オブジェクト表示の有無
    this.visible = true;

    //質量
    this.mass = 1.0;

    //運動の記録を行う
    this.recordData = false;

    //オブジェクトの内部時間
    this.step = 0;

    //運動記録の間引回数
    this.skipRecord = 100;

    //マウスドラックの有無
    this.draggable = false;

    //マウスドラックの許可
    this.allowDrag = false;

    //頂点座標のローテンション
    this.rotationXYZ = false;

    //衝突の検知
    this.collision = false;

    //衝突判定グループ
    this.collisionGroups = [];

    //反発係数
    this.e = 1.0;

    //姿勢軸ベクトルと姿勢軸周りの回転角の初期値
    this.axis = new THREE.Vector3(0, 0, 1);
    this.angle = 0;

    //姿勢を表すクォータニオン
    this.quaternion = new THREE.Quaternion();

    //３次元グラフィックス材質関連パラメータ
    this.material = {
        type: "Lambert",      //材質の種類 （ "Basic" | "Lambert" | "Phong" | "Normal"）
        shading: "Flat",      //シェーディングの種類 （ "Flat" | "Smooth" ）
        side: "Front",        //描画する面 ( "Front" | "Back" | "Double")
        color: 0xFF0000,     //反射色（発光材質の場合：発光色）
        ambient: 0x990000,    //環境色
        opacity: 1.0,         //不透明度
        transparent: false,   //透過処理
        emissive: 0x000000,   //反射材質における発光色
        specular: 0x111111,   //鏡面色
        shininess: 30,        //鏡面指数
        castShadow: false,    //影の生成
        receiveShadow: false, //影の映り込み
        depthWrite: true,     //デプスバッファ書き込みの可否
        depthTest: true,     //デプステスト実施の有無
        textureWidth: 256,    //動的テクスチャ生成時の横幅
        textureHeight: 256,   //動的テクスチャ生成時の縦幅
        blending: null,       //ブレンディングの種類 （ "No" | "Normal" | "Additive" | "Subtractive" | "Multiply" | "Custo" ）
        bumpScale: 0.05,      //バンプの大きさ
        vertexColors: false    //頂点色利用の有無
    };

    //軌跡の可視化関連パラメータ
    this.locus = {
        enabled: false,    //可視化の有無
        visible: false,    //表示・非表示の指定
        color: null,      //発光色
        maxNum: 1000,      //軌跡ベクトルの最大配列数
    };

    //速度ベクトルの可視化関連パラメータ
    this.velocityVector = {
        enabled: false,    //可視化の有無
        visible: false,    //表示・非表示の指定
        color: null,      //発光色
        scale: 0.5,         //矢印のスケール
    };

    //バウンディングボックスの可視化関連パラメータ
    this.boundingBox = {
        visible: false,    //表示・非表示の指定
        color: null,      //発光色
        opacity: 0.2,      //不透明度
        transparent: true, //透過処理
        draggFlag: false   //マウスドラック状態かを判定するフラグ（内部プロパティ）
    };

    //バウンディング球の可視化関連パラメータ
    this.boundingSphere = {
        enabled: false,    //可視化の有無
        visible: false,    //表示・非表示の指定
        color: null,      //発光色
        opacity: 0.2,      //不透明度
        transparent: true, //透過処理
        widthSegments: 40, //y軸周りの分割数
        heightSegments: 40  //y軸上の正の頂点から負の頂点までの分割数
    };


    //ストロボ撮影の関連パラメータ
    this.strobe = {
        enabled: false,    //ストロボ撮影の有無
        visible: false,    //表示・非表示の指定
        color: null,       //描画色
        transparent: true, //透明化
        opacity: 0.5,      //透明度
        maxNum: 20,        //ストロボオブジェクトの数
        skip: 10,          //ストロボの間隔
        velocityVectorEnabled: false, //速度ベクトルの利用
        velocityVectorVisible: false, //速度ベクトルの表示
    };

    //経路の指定
    this.path = {
        enabled: false,    //経路指定の有無
        visible: false,    //表示・非表示の指定
        color: null,       //描画色
        type: "LineBasic",  //線の種類（ "LineBasic" || "LineDashed"）
        dashSize: 0.2,     //破線の実線部分の長さ 
        gapSize: 0.2,      //破線の空白部分の長さ
        parametricFunction: {
            enabled: true,    //媒介変数関数設定の有無
            pointNum: 100,     //経路の描画点の数
            theta: {min: 0, max: 1}, //媒介変数の範囲
            position: null,    //頂点座標を指定する媒介変数関数
            tangent: null,     //接線ベクトルを指定する媒介変数関数
            curvature: null,   //曲率ベクトルを指定する媒介変数関数
            getTheta: null     //媒介変数の取得
        },
        restoringForce: {
            enabled: false, //拘束状態への復元の有無
            k: 1.0,         //復元力のばね定数
            gamma: 0.01     //復元力の減衰係数
        }
    }

    this.beforeCreateFunctions = [];
    this.afterCreateFunctions = [];
    this.beforeUpdateFunctions = [];
    this.afterUpdateFunctions = [];
    this.beforeTimeEvolutionFunctions = [];
    this.afterTimeEvolutionFunctions = [];
    this.dynamicFunctions = [];

    //////////////////////////////////////////////////////////////////////////
    // 内部プロパティ
    //////////////////////////////////////////////////////////////////////////
    //運動の記録を格納するオブジェクト
    this.data = {};
    this.data.x = [];  //x座標
    this.data.y = [];  //y座標
    this.data.z = [];  //z座標
    this.data.vx = []; //速度のx成分
    this.data.vy = []; //速度のy成分
    this.data.vz = []; //速度のz成分
    this.data.kinetic = [];   //運動エネルギー   
    this.data.potential = []; //ポテンシャルエネルギー
    this.data.energy = [];    //力学的エネルギー
    this.data.collisionHistory = []; //衝突履歴

/////////////////////////////////////////////////////////////////	
    var list = [];

    for (var propertyName in this) {
        if (this.hasOwnProperty(propertyName)) {

            list.push(propertyName);

        }

    }
    //コピー対象プロパティリスト
    this.copyPropertyList = list;
/////////////////////////////////////////////////////////////////	

    //形状オブジェクト関連
    this.geometry = {
        type: null,     //形状の種類
    };

    //３次元オブジェクト番号
    this.id = 0;
    //３次元グラフィックス用オブジェクト
    this.CG = {};

    //物理実験室
    this.physLab = null;

    //子要素として格納する本クラス（派生クラス）のオブジェクト
    this.children = [];

    //親オブジェクトを格納
    this.parent = null;

    //頂点ベクトルの初期値
    this._vertices = [];

    //現在の頂点座標
    this.vertices = [];

    //頂点色
    this.colors = [];

    //面を構成する頂点番号
    this.faces = [];

    //接線ベクトル
    this.tangents = [];

    //法線ベクトル
    this.normals = [];

    //３次元オブジェクトの中心座標
    this.centerOfGeometry = null;

    //衝突オブジェクト
    this.collisionObjects = [];

    //衝突力
    this.collisionForce = null;

    //接触力
    this.contactForce = null;

    //各種ベクトル量の更新の必要性
    this.vectorsNeedsUpdate = true;

    //非同期フラグ
    this.asynchronous = false;

    //パラメータ設定
    this.setParameter(parameter);
}
////////////////////////////////////////////////////////////////////
// クラスプロパティ
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.id = 0;

////////////////////////////////////////////////////////////////////
// パラメータの設定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.setParameter = function (parameter) {
    parameter = parameter || {};

    //パラメータの指定
    PHYSICS.overwriteProperty(this, parameter);

    //姿勢軸ベクトルの初期値
    if (parameter.axis) {
        this.axis.set(parameter.axis.x, parameter.axis.y, parameter.axis.z).normalize();
    }

    //クォータニオンの初期化
    this.initQuaternion();

    //軌跡の色
    this.locus.color = this.locus.color || this.material.color;
    //速度ベクトルの色
    this.velocityVector.color = this.velocityVector.color || this.material.color;
    //バウンディングボックスの色
    this.boundingBox.color = this.boundingBox.color || this.material.color;
    //バウンディング球の色
    this.boundingSphere.color = this.boundingSphere.color || this.material.color;
    //ストロボオブジェクトの色
    this.strobe.color = this.strobe.color || this.material.color;

    //経路オブジェクトの色
    this.path.color = this.path.color || this.material.color;
}

////////////////////////////////////////////////////////////////////
// パラメータの再設定
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.resetParameter = function (parameter) {
    //運動データの初期化
    this.initDynamicData();

    //パラメータの設定
    this.setParameter(parameter);

    //プロットデータ配列に初期値を代入
    this.recordDynamicData();

    //r_{-1}の値を取得する
    this.computeInitialCondition();
}


////////////////////////////////////////////////////////////////////
// オブジェクトのコピー
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getProperty = function () {

    return this.physLab.getProperty(this);

}
//３次元オブジェクトの完全コピー
PHYSICS.PhysObject.prototype.clone = function () {

    return this.physLab.clone(this);

}
//３次元オブジェクトのクラス名を取得
PHYSICS.PhysObject.prototype.getClassName = function () {

    //名前空間に存在する全てのクラスを走査
    for (var className in PHYSICS) {

        //コンストラクタが一致した時のプロパティ名がクラス名
        if (this.constructor === PHYSICS[className]) {

            return className;

        }

    }

}

////////////////////////////////////////////////////////////////////
// ３次元グラフィックスの生成
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.create3DCG = function () {
    //形状オブジェクト
    var geometry = this.getGeometry();

    //材質オブジェクトの取得
    var material = this.getMaterial();


    //３次元グラフィックス用オブジェクトの生成
    if (this instanceof PHYSICS.Line) {

        //線オブジェクト
        this.CG = new THREE.Line(geometry, material);

    } else {

        //その他のオブジェクト
        this.CG = new THREE.Mesh(geometry, material);

    }


    //マウスドラックによる移動を行う場合
    if (this.draggable) {

        //バウンディングボックスの計算
        this.CG.geometry.computeBoundingBox();

        //バウンディングボックスの幅の取得
        this.boundingBox.width = new THREE.Vector3().subVectors(
            this.CG.geometry.boundingBox.max,
            this.CG.geometry.boundingBox.min
        );

        //形状オブジェクトの宣言と生成
        var geometry = new THREE.BoxGeometry(
            this.boundingBox.width.x,
            this.boundingBox.width.y,
            this.boundingBox.width.z
        );

        //材質オブジェクトの宣言と生成
        var material = new THREE.MeshBasicMaterial({
            color: this.boundingBox.color,
            transparent: this.boundingBox.transparent,
            opacity: this.boundingBox.opacity
        });

        //バウンディングボックスオブジェクトの生成
        this.boundingBox.CG = new THREE.Mesh(geometry, material);

        //バウンディングボックスオブジェクトのローカル座標系における中心座標を格納（回転前）
        this.boundingBox._center = new THREE.Vector3().addVectors(
            this.CG.geometry.boundingBox.max,
            this.CG.geometry.boundingBox.min
        ).divideScalar(2);

        //回転後のバウンディングボックスの中心座標
        this.boundingBox.center = new THREE.Vector3();

        //バウンディングボックスオブジェクトの位置を指定
        this.boundingBox.CG.position.copy(this.r).add(this.boundingBox._center);

        //バウンディングボックスオブジェクトの表示の有無を指定
        this.boundingBox.CG.visible = this.boundingBox.visible;

        //バウンディング球オブジェクトのシーンへの追加
        this.physLab.CG.scene.add(this.boundingBox.CG);

        //バウンディングボックスオブジェクトに３次元オブジェクトを指定
        this.boundingBox.CG.physObject = this;

    }

    //バウンディング球の計算
    this.CG.geometry.computeBoundingSphere();
    this.boundingSphere.radius = this.CG.geometry.boundingSphere.radius;
    this.boundingSphere.center = this.CG.geometry.boundingSphere.center;

    //バウンディング球オブジェクトの表示
    if (this.boundingSphere.visible) {
        //形状オブジェクトの宣言と生成
        var geometry = new THREE.SphereGeometry(
            this.boundingSphere.radius,
            this.boundingSphere.widthSegments,
            this.boundingSphere.heightSegments
        );
        //材質オブジェクトの宣言と生成
        var material = new THREE.MeshBasicMaterial({
            color: this.boundingSphere.color,
            transparent: this.boundingSphere.transparent,
            opacity: this.boundingSphere.opacity
        });
        //バウンディング球オブジェクトの生成
        this.boundingSphere.CG = new THREE.Mesh(geometry, material);
        this.boundingSphere.CG.position.copy(this.r).add(this.boundingSphere.center);
        //バウンディング球オブジェクトのシーンへの追加
        this.physLab.CG.scene.add(this.boundingSphere.CG);
    }

}

////////////////////////////////////////////////////////////////////
// 形状オブジェクトの生成
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getGeometry = function (type, parameter) {

    //材質の種類
    type = type || this.geometry.type;
    parameter = parameter || {};

    if (type === "Polygon" || type === "Line") {

        //頂点の再設定
        if (this.resetVertices) {
            for (var i = 0; i < this._vertices.length; i++) {
                this._vertices[i].sub(this.centerOfGeometry);
            }
        }

        //形状オブジェクトの宣言と生成
        var _geometry = new THREE.Geometry();

        //形状オブジェクトに頂点座標の設定
        for (var i = 0; i < this._vertices.length; i++) {
            _geometry.vertices.push(this._vertices[i]);
        }


        if (type === "Polygon") {

            //全てのポリゴン面を指定する
            for (var i = 0; i < this.faces.length; i++) {

                if (this.material.vertexColors === "Vertex") {

                    var colors = [
                        this.colors[this.faces[i][0]],
                        this.colors[this.faces[i][1]],
                        this.colors[this.faces[i][2]]
                    ]

                } else {

                    var colors = null;

                }

                _geometry.faces.push(new THREE.Face3(this.faces[i][0], this.faces[i][1], this.faces[i][2], null, colors));

            }

            //面の法線ベクトルを計算
            _geometry.computeFaceNormals();
            //面の法線ベクトルから頂点法線ベクトルの計算
            _geometry.computeVertexNormals();

        } else {


            for (var i = 0; i < this.colors.length; i++) {
                _geometry.colors.push(this.colors[i]);
            }
            //頂点間距離の累積距離を計算
            _geometry.computeLineDistances();


        }

    } else if (type === "Sphere") {

        //球オブジェクトの形状オブジェクト
        var _geometry = new THREE.SphereGeometry(
            parameter.radius || this.geometry.radius,         //球の半径
            parameter.widthSegments || this.geometry.widthSegments,  //y軸周りの分割数
            parameter.heightSegments || this.geometry.heightSegments, //y軸上の正の頂点から負の頂点までの分割数
            parameter.phiStart || this.geometry.phiStart,       //y軸回転の開始角度
            parameter.phiLength || this.geometry.phiLength,      //y軸回転角度
            parameter.thetaStart || this.geometry.thetaStart,     //x軸回転の開始角度。
            parameter.thetaLength || this.geometry.thetaLength     //x軸回転角度
        );

    } else if (type === "Plane") {

        //平面オブジェクトの形状オブジェクト
        var _geometry = new THREE.PlaneGeometry(
            parameter.width || this.geometry.width,    //平面の横幅（x軸方向）
            parameter.height || this.geometry.height,   //平面の縦軸（y軸方向）
            parameter.widthSegments || this.geometry.widthSegments,  //横方向分割数
            parameter.heightSegments || this.geometry.heightSegments  //縦方向分割数
        );

    } else if (type === "Cube") {

        //立方体オブジェクトの形状オブジェクト
        var _geometry = new THREE.BoxGeometry(
            parameter.width || this.geometry.width,  //立方体の横幅  （x軸方向）
            parameter.depth || this.geometry.depth,  //立方体の奥行き （y軸方向）
            parameter.height || this.geometry.height,  //立方体の高さ   （z軸方向）
            parameter.widthSegments || this.geometry.widthSegments,   //横方向分割数  
            parameter.heightSegments || this.geometry.heightSegments,  //縦方向分割数
            parameter.depthSegments || this.geometry.depthSegments    //奥行き方向分割数
        );

    } else if (type === "Circle") {

        //円オブジェクトの形状オブジェクト
        var _geometry = new THREE.CircleGeometry(
            parameter.radius || this.geometry.radius,          //円の半径
            parameter.segments || this.geometry.segments,      //円の分割数
            parameter.thetaStart || this.geometry.thetaStart,  //円弧の開始角度
            parameter.thetaLength || this.geometry.thetaLength //円弧の終了角度
        );

    } else if (type === "Cylinder") {

        //円柱オブジェクトの形状オブジェクト
        var _geometry = new THREE.CylinderGeometry(
            parameter.radiusTop || this.geometry.radiusTop,           //円柱の上の円の半径
            parameter.radiusBottom || this.geometry.radiusBottom,     //円柱の下の円の半径
            parameter.height || this.geometry.height,                 //円柱の高さ
            parameter.radialSegments || this.geometry.radialSegments, //円の分割数
            parameter.heightSegments || this.geometry.heightSegments, //円の高さ方向の分割数
            parameter.openEnded || this.geometry.openEnded            //筒状
        );

    } else if (type === "Spring") {

        //ばねオブジェクトの形状オブジェクト
        var _geometry = this.getSpringGeometry(
            this.radius,  //バネの半径
            this.tube,  //管の半径
            this.length, //バネの長さ
            this.windingNumber, //巻き数
            this.radialSegments, //外周の分割数
            this.tubularSegments  //管の分割数
        );

    } else {

        alert("形状オブジェクトの設定ミス");

    }

    //頂点座標を（x,y,z）→（z,x,y）へローテーション
    if (type !== "Polygon" && this.rotationXYZ) {

        for (var i = 0; i < _geometry.vertices.length; i++) {
            var r = _geometry.vertices[i].clone();
            _geometry.vertices[i].x = r.z;
            _geometry.vertices[i].y = r.x;
            _geometry.vertices[i].z = r.y;
        }

        for (var i = 0; i < _geometry.faces.length; i++) {
            var r = _geometry.faces[i].normal.clone();
            _geometry.faces[i].normal.x = r.z;
            _geometry.faces[i].normal.y = r.x;
            _geometry.faces[i].normal.z = r.y;
        }

        for (var i = 0; i < _geometry.faces.length; i++) {
            for (var j = 0; j < _geometry.faces[i].vertexNormals.length; j++) {
                var r = _geometry.faces[i].vertexNormals[j].clone();
                _geometry.faces[i].vertexNormals[j].x = r.z;
                _geometry.faces[i].vertexNormals[j].y = r.x;
                _geometry.faces[i].vertexNormals[j].z = r.y;
            }
        }

    }

    return _geometry;

}

////////////////////////////////////////////////////////////////////
// 材質オブジェクトの生成
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getMaterial = function (type, parameter) {

    //材質の種類
    type = type || this.material.type;

    parameter = parameter || {};

    //材質パラメータ
    var _parameter = {
        color: ( parameter.color !== undefined ) ? parameter.color : this.material.color,
        ambient: ( parameter.ambient !== undefined ) ? parameter.ambient : this.material.ambient,
        transparent: ( parameter.transparent !== undefined ) ? parameter.transparent : this.material.transparent,
        opacity: ( parameter.opacity !== undefined ) ? parameter.opacity : this.material.opacity,
        emissive: ( parameter.emissive !== undefined ) ? parameter.emissive : this.material.emissive,
        specular: ( parameter.specular !== undefined ) ? parameter.specular : this.material.specular,
        shininess: ( parameter.shininess !== undefined ) ? parameter.shininess : this.material.shininess,
        side: ( parameter.side !== undefined ) ? parameter.side : this.material.side,
        shading: ( parameter.shading !== undefined ) ? parameter.shading : this.material.shading,
        depthWrite: ( parameter.depthWrite !== undefined ) ? parameter.depthWrite : this.material.depthWrite,
        blending: ( parameter.blending !== undefined ) ? parameter.blending : this.material.blending,
        bumpScale: ( parameter.bumpScale !== undefined ) ? parameter.bumpScale : this.material.bumpScale,
        vertexColors: ( parameter.vertexColors !== undefined ) ? parameter.vertexColors : this.material.vertexColors,
    };

    function setMapParameter(texture, scope) {
        //テクスチャラッピングの指定（デフォルト値）
        texture.wrapS = THREE.ClampToEdgeWrapping; //s軸方向
        texture.wrapT = THREE.ClampToEdgeWrapping; //t軸方向

        if (scope.material.mapWrapS == "RepeatWrapping")
            texture.wrapS = THREE.RepeatWrapping;
        else if (scope.material.mapWrapS == "MirroredRepeatWrapping")
            texture.wrapS = THREE.MirroredRepeatWrapping;

        if (scope.material.mapWrapT == "RepeatWrapping")
            texture.wrapT = THREE.RepeatWrapping;
        else if (scope.material.mapWrapT == "MirroredRepeatWrapping")
            texture.wrapT = THREE.MirroredRepeatWrapping;
        //リピート数の指定
        texture.repeat.set(1, 1);
        if (scope.material.mapRepeat) {
            texture.repeat.set(scope.material.mapRepeat.s, scope.material.mapRepeat.t);
        }
        //上下反転
        texture.flipY = ( scope.material.flipY !== undefined ) ? scope.material.flipY : true;
    }

    var texture;
    //テクスチャマッピング
    if (texture = parameter.mapTexture || this.material.mapTexture) {
        //テクスチャの読み込み
        _parameter.map = THREE.ImageUtils.loadTexture(texture);
        setMapParameter(_parameter.map, this);

    }
    //法線マッピング
    if (texture = parameter.normalMapTexture || this.material.normalMapTexture) {
        //テクスチャの読み込み
        _parameter.normalMap = THREE.ImageUtils.loadTexture(texture);
        setMapParameter(_parameter.normalMap, this);
    }
    //鏡面マッピング
    if (texture = parameter.specularMapTexture || this.material.specularMapTexture) {
        //テクスチャの読み込み
        _parameter.specularMap = THREE.ImageUtils.loadTexture(texture);
        setMapParameter(_parameter.specularMap, this);
    }
    //バンプマッピング
    if (texture = parameter.bumpMapTexture || this.material.bumpMapTexture) {
        //テクスチャの読み込み
        _parameter.bumpMap = THREE.ImageUtils.loadTexture(texture);
        setMapParameter(_parameter.bumpMap, this);
    }

    //環境マッピング
    if (texture = parameter.envMapTexture || this.material.envMapTexture) {
        //テクスチャの読み込み
        _parameter.envMap = THREE.ImageUtils.loadTextureCube(texture, new THREE.CubeReflectionMapping());
        //画像データのフォーマットの指定
        _parameter.envMap.format = THREE.RGBFormat;
    }

    function generateCanvas(textureFunction, width, height) {
        //canvas要素の生成
        var canvas = document.createElement('canvas');
        //canvas要素のサイズ
        canvas.width = width;   //横幅
        canvas.height = height; //縦幅
        //コンテキストの取得
        var context = canvas.getContext('2d');

        //ビットマップデータのRGBAデータ格納配列
        var bitmapData = [];
        //RGBAデータ格納配列への値の代入
        for (var t = 0; t < canvas.height; t++) {
            for (var s = 0; s < canvas.width; s++) {
                var index = ( t * canvas.width + s) * 4; //各ピクセルの先頭を与えるインデクス番号

                var color = textureFunction(s, t);
                //ビットマップデータのRGBAデータ
                bitmapData[index + 0] = 255 * color.r; //R値
                bitmapData[index + 1] = 255 * color.g; //G値
                bitmapData[index + 2] = 255 * color.b; //B値
                bitmapData[index + 3] = 255 * color.a; //A値
            }
        }
        //イメージデータオブジェクトの生成
        var imageData = context.createImageData(canvas.width, canvas.height);
        for (var i = 0; i < canvas.width * canvas.height * 4; i++) {
            imageData.data[i] = bitmapData[i]; //配列のコピー
        }
        //イメージデータオブジェクトからcanvasに描画する
        context.putImageData(imageData, 0, 0);
        return canvas;
    }

    var textureFunction;
    //テクスチャマッピング
    if (textureFunction = parameter.mapTextureFunction || this.material.mapTextureFunction) {

        //テクスチャ画像用のcanvas要素の取得
        var canvas = generateCanvas(textureFunction, this.material.textureWidth, this.material.textureHeight);
        //テクスチャオブジェクトの生成
        _parameter.map = new THREE.Texture(canvas);
        //テクスチャ画像の更新
        _parameter.map.needsUpdate = true;

        setMapParameter(_parameter.map, this);
    }

    //法線マッピング
    if (textureFunction = parameter.normalMapTextureFunction || this.material.normalMapTextureFunction) {

        //テクスチャ画像用のcanvas要素の取得
        var canvas = generateCanvas(textureFunction, this.material.textureWidth, this.material.textureHeight);
        //テクスチャオブジェクトの生成
        _parameter.normalMap = new THREE.Texture(canvas);
        //テクスチャ画像の更新
        _parameter.normalMap.needsUpdate = true;

        setMapParameter(_parameter.normalMap, this);
    }

    //鏡面マッピング
    if (textureFunction = parameter.specularMapTextureFunction || this.material.specularMapTextureFunction) {

        //テクスチャ画像用のcanvas要素の取得
        var canvas = generateCanvas(textureFunction, this.material.textureWidth, this.material.textureHeight);
        //テクスチャオブジェクトの生成
        _parameter.specularMap = new THREE.Texture(canvas);
        //テクスチャ画像の更新
        _parameter.specularMap.needsUpdate = true;

        setMapParameter(_parameter.specularMap, this);
    }

    //バンプマッピング
    if (textureFunction = parameter.bumpMapTextureFunction || this.material.bumpMapTextureFunction) {

        //テクスチャ画像用のcanvas要素の取得
        var canvas = generateCanvas(textureFunction, this.material.textureWidth, this.material.textureHeight);
        //テクスチャオブジェクトの生成
        _parameter.bumpMap = new THREE.Texture(canvas);
        //テクスチャ画像の更新
        _parameter.bumpMap.needsUpdate = true;

        setMapParameter(_parameter.bumpMap, this);
    }

    //材質パラメータの更新
    PHYSICS.overwriteProperty(_parameter, parameter);

    //カリングの指定
    if (_parameter.side === "Front") {

        //表面
        _parameter.side = THREE.FrontSide;

    } else if (_parameter.side === "Double") {

        //両面
        _parameter.side = THREE.DoubleSide;

    } else if (_parameter.side === "Back") {

        //背面
        _parameter.side = THREE.BackSide;

    } else {

        alert("描画面指定ミス");

    }

    //シェーディングの指定
    if (_parameter.shading === "Flat") {

        //フラットシェーディング
        _parameter.shading = THREE.FlatShading;

    } else if (_parameter.shading === "Smooth") {

        //スムースシェーディング
        _parameter.shading = THREE.SmoothShading;

    } else {

        alert("シェーディング指定ミス");

    }

    //ブレンディングの指定
    if (_parameter.blending === "No") {

        _parameter.blending = THREE.NoBlending;

    } else if (_parameter.blending === "Normal") {

        _parameter.blending = THREE.NormalBlending;

    } else if (_parameter.blending === "Additive") {

        _parameter.blending = THREE.AdditiveBlending;

    } else if (_parameter.blending === "Subtractive") {

        _parameter.blending = THREE.SubtractiveBlending;

    } else if (_parameter.blending === "Multiply") {

        _parameter.blending = THREE.MultiplyBlending;

    } else if (_parameter.blending === "Custom") {

        _parameter.blending = THREE.CustomBlending;

    }

    //頂点色の指定
    if (_parameter.vertexColors === "No") {

        _parameter.vertexColors = THREE.NoColors;

    } else if (_parameter.vertexColors === "Vertex") {

        _parameter.vertexColors = THREE.VertexColors;

    } else if (_parameter.vertexColors === "Face") {

        _parameter.vertexColors = THREE.FaceColors;

    }


    //材質オブジェクトの宣言と生成
    if (type === "Lambert") {

        //ランバート反射材質
        var _material = new THREE.MeshLambertMaterial(_parameter);

    } else if (type === "Phong") {

        //フォン反射材質
        var _material = new THREE.MeshPhongMaterial(_parameter);

    } else if (type === "Basic") {

        //発光材質
        var _material = new THREE.MeshBasicMaterial(_parameter);

    } else if (type === "Normal") {

        //法線材質
        var _material = new THREE.MeshNormalMaterial(_parameter);

    } else if (type === "LineBasic") {

        //実線発光材質
        var _material = new THREE.LineBasicMaterial(_parameter);

    } else if (type === "LineDashed") {

        //破線発光材質専用のパラメータ
        _parameter.dashSize = ( parameter.dashSize !== undefined ) ? parameter.dashSize : this.material.dashSize,
            _parameter.gapSize = ( parameter.gapSize !== undefined ) ? parameter.gapSize : this.material.gapSize

        //破線発光材質
        var _material = new THREE.LineDashedMaterial(_parameter);

    } else {

        alert("材質オブジェクト指定ミス");

    }

    return _material;
}

////////////////////////////////////////////////////////////////////
// オブジェクトの生成
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.create = function () {

    this.beforeCreate();

    //３次元オブジェクト通し番号
    PHYSICS.PhysObject.id++;
    this.id = PHYSICS.PhysObject.id;

    //３次元グラフィックスの生成
    this.create3DCG();

    //オブジェクトの影の生成元
    this.CG.castShadow = this.material.castShadow;

    //オブジェクトに影を描画
    this.CG.receiveShadow = this.material.receiveShadow;

    //オブジェクトのシーンへの追加
    this.physLab.CG.scene.add(this.CG);

    //速度ベクトルの表示
    if (this.velocityVector.enabled) {

        //矢印オブジェクトの生成
        this.velocityVector.CG = new THREE.ArrowHelper(
            this.v.clone().normalize(), //方向ベクトル
            this.r.clone(),             //起点座標
            1,                          //長さ
            this.velocityVector.color   //色
        );
        //矢印オブジェクトのシーンへの追加
        this.physLab.CG.scene.add(this.velocityVector.CG);

    }
    //軌跡オブジェクトの表示
    if (this.locus.enabled) {

        //形状オブジェクトの宣言
        var geometry = new THREE.BufferGeometry();
        //アトリビュート変数のサイズを指定
        geometry.attributes = {
            position: {                                           //頂点座標
                itemSize: 3,                                      //各頂点ごとの要素数（x,y,z）
                array: new Float32Array(this.locus.maxNum * 3), //配列の宣言
                numItems: this.locus.maxNum * 3,                  //配列の要素数
                dynamic: true
            }
        }
        //材質オブジェクトの生成
        var material = new THREE.LineBasicMaterial({color: this.locus.color});
        //軌跡オブジェクトの作成
        this.locus.CG = new THREE.Line(geometry, material);
        //軌跡オブジェクトのシーンへの追加
        this.physLab.CG.scene.add(this.locus.CG);
    }

    //時間制御スライダー利用時
    if (this.physLab.timeslider.enabled) {

        //運動するオブジェクトの時系列データを取得
        if (this.dynamic || this.draggable) {

            this.recordData = true;

            //時系列データ間引数を共通化
            this.skipRecord = this.physLab.timeslider.skipRecord;

        } else {

            this.recordData = false;

        }
    }

    //ストロボ利用時
    if (this.strobe.enabled) {

        //全てのオブジェクトの時系列データを取得
        this.recordData = true;

        this.strobe.objects = [];

        for (var j = 0; j < this.strobe.maxNum; j++) {
            this.strobe.objects[j] = this.clone();

            this.strobe.objects[j].dynamic = false;
            this.strobe.objects[j].draggable = false;
            this.strobe.objects[j].allowDrag = false;
            this.strobe.objects[j].collision = false;

            this.strobe.objects[j].locus.enabled = false;
            this.strobe.objects[j].strobe.enabled = false;

            this.strobe.objects[j].velocityVector.enabled = this.strobe.velocityVectorEnabled;
            this.strobe.objects[j].velocityVector.visible = this.strobe.velocityVectorVisible;

            this.strobe.objects[j].material.transparent = this.strobe.transparent;
            this.strobe.objects[j].material.opacity = this.strobe.opacity;

            this.strobe.objects[j].parent = this;

            this.physLab.objects.push(this.strobe.objects[j]);
        }

    }

    //経路オブジェクトの生成
    if (this.path.enabled) {
        this.path.line = new PHYSICS.Line({
            draggable: false,           //マウスドラックの有無
            allowDrag: false,          //マウスドラックの可否
            collision: false,          //衝突判定の有無
            resetVertices: false,     //頂点再設定の有無
            visible: this.path.visible,         //表示の有無
            material: {
                type: this.path.type,          //線の種類
                color: this.path.color,        //発光色
                dashSize: this.path.dashSize,  //破線の実線部分の長さ 
                gapSize: this.path.gapSize,    //破線の空白部分の長さ
            },
            parametricFunction: this.path.parametricFunction,            //媒介変数関数
            dynamicFunction: this.path.dynamicFunction || function () {
            }, //動的関数
        })


        this.path.line.parent = this;

        this.physLab.objects.push(this.path.line);

    }

    //配列に初期値を代入
    this.recordDynamicData();

    //r_{-1}の値を取得する
    this.computeInitialCondition();

    this.afterCreate();
}

////////////////////////////////////////////////////////////////////
// ３次元グラフィックスの更新
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.update = function () {

    this.beforeUpdate();

    //非同期生成中の場合はスキップ
    if (this.asynchronous) return;

    //位置ベクトルの指定
    this.CG.position.copy(this.r);

    //姿勢ベクトルによる回転
    this.CG.setRotationFromQuaternion(this.quaternion);

    //オブジェクトの可視化
    this.CG.visible = this.visible;

    //３次元グラフィックス子要素の可視化も指定
    for (var i = 0; i < this.CG.children.length; i++) {

        this.CG.children[i].visible = this.visible;

    }

    //軌跡オブジェクトの更新
    this.updateLocus();

    //速度ベクトルの更新
    this.updateVelocityVector();

    //バウンディングボックスの位置と姿勢の更新
    this.updateBoundingBox();

    //ストロボ撮影の更新
    this.updateStrobe();

    //バウンディング球の更新
    this.updateBoundingSphere();

    this.afterUpdate();

}


////////////////////////////////////////////////////////////////////
// 軌跡オブジェクトの更新
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.updateLocus = function (color) {

    if (!this.locus.enabled) return;

    color = ( color !== undefined ) ? color : this.locus.color;

    var start = this.data.x.length - 1;
    var end = this.locus.CG.geometry.attributes.position.array.length / 3;

    //時間制御スライダーの利用時
    if (this.physLab.timeslider.enabled && this.physLab.pauseFlag) start = this.physLab.timeslider.m;

    for (var n = 0; n < start; n++) {
        //頂点の位置座標の設定
        this.locus.CG.geometry.attributes.position.array[n * 3] = this.data.x[n][1];
        this.locus.CG.geometry.attributes.position.array[n * 3 + 1] = this.data.y[n][1];
        this.locus.CG.geometry.attributes.position.array[n * 3 + 2] = this.data.z[n][1];
    }
    for (var n = start; n < end; n++) {
        //頂点の位置座標の設定
        this.locus.CG.geometry.attributes.position.array[n * 3] = this.data.x[start][1];
        this.locus.CG.geometry.attributes.position.array[n * 3 + 1] = this.data.y[start][1];
        this.locus.CG.geometry.attributes.position.array[n * 3 + 2] = this.data.z[start][1];
    }

    //頂点座標の更新を通知
    this.locus.CG.geometry.attributes.position.needsUpdate = true;

    //色の指定
    this.locus.CG.material.color.setHex(color);


    //表示フラグ
    var flag = false;

    if (this.physLab.locusFlag == true) {

        flag = true;

    } else if (this.physLab.locusFlag == false) {

        flag = false;

    } else if (this.physLab.locusFlag == "pause") {

        flag = ( this.physLab.pauseFlag ) ? true : false;

    }

    if (this.physLab.playback.enabled && this.physLab.playback.on) {

        flag = this.physLab.playback.locusVisible;

    }

    //軌跡の表示
    this.locus.CG.visible = flag && this.locus.visible;

}

////////////////////////////////////////////////////////////////////
// 速度ベクトルの更新
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.updateVelocityVector = function (color, scale) {

    if (!this.velocityVector.enabled) return;

    color = ( color !== undefined ) ? color : this.velocityVector.color;
    scale = ( scale !== undefined ) ? scale : this.velocityVector.scale;

    //速度の大きさ
    var v = this.v.length() * scale;

    if (v < 0.01) {
        v = 0.01;
        scale = 0.01;
    }

    this.velocityVector.CG.setDirection(this.v.clone().normalize());
    this.velocityVector.CG.setLength(v, scale, scale);
    this.velocityVector.CG.position.copy(this.r);
    this.velocityVector.CG.setColor(color);

    //表示フラグ
    var flag = false;

    //速度ベクトルの表示
    if (this.physLab.velocityVectorFlag === true) {

        flag = true;

    } else if (this.physLab.velocityVectorFlag === false) {

        flag = false;

    } else if (this.physLab.velocityVectorFlag === "pause") {

        flag = ( this.physLab.pauseFlag ) ? true : false;

    }

    if (this.physLab.playback.enabled && this.physLab.playback.on) {

        flag = this.physLab.playback.velocityVectorVisible;

    }

    //子要素の可視化も指定
    for (var i = 0; i < this.velocityVector.CG.children.length; i++) {
        this.velocityVector.CG.children[i].visible = flag && this.velocityVector.visible;
    }

}
////////////////////////////////////////////////////////////////////
// バウンディングボックスのの更新
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.updateBoundingBox = function () {

    if (!this.draggable) return;

    //回転前のバウンディングの中心座標をコピー
    this.boundingBox.center.copy(this.boundingBox._center);

    //行列要素の生成
    var mv = new THREE.Matrix4().compose(
        new THREE.Vector3(),      //平行移動（Vector3クラス）
        this.quaternion,          //回転量（Quaternionクラス）
        new THREE.Vector3(1, 1, 1)  //拡大量（Vector3クラス）
    );
    //回転後の中心座標の位置ベクトル
    this.boundingBox.center.applyMatrix4(mv);


    //バウンディングボックスの位置と姿勢の更新
    this.boundingBox.CG.position.copy(this.r).add(this.boundingBox.center);
    this.boundingBox.CG.setRotationFromQuaternion(this.quaternion);

    //表示フラグ
    var flag = false;

    if (this.physLab.boundingBoxFlag == true) {

        flag = true;

    } else if (this.physLab.boundingBoxFlag == false) {

        flag = false;

    } else if (this.physLab.boundingBoxFlag == "dragg") {

        flag = ( this.boundingBox.draggFlag ) ? true : false;

    }

    //バウンディングボックスの表示
    this.boundingBox.CG.visible = flag && this.boundingBox.visible;

    //マウスドラックに応じた速度ベクトル、加速度ベクトルの計算
    if (!this.dynamic) {

        //過去の時刻を格納
        this.v_1.copy(this.v);
        //マウスドラックによる３次元オブジェクトの移動速度
        this.v = new THREE.Vector3().subVectors(this.r, this.r_1).divideScalar(this.physLab.dt * this.physLab.skipRendering);

        //マウスドラックによる３次元オブジェクトの移動加速度
        this.a = new THREE.Vector3().subVectors(this.v, this.v_1).divideScalar(this.physLab.dt * this.physLab.skipRendering);

        //過去の位置を格納
        this.r_1.copy(this.r);

    }

}

////////////////////////////////////////////////////////////////////
//ストロボ撮影の更新
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.updateStrobe = function () {

    if (!this.strobe.enabled) return;

    for (var j = 0; j < this.strobe.maxNum; j++) {
        this.strobe.objects[j].visible = false;
        this.strobe.objects[j].velocityVector.visible = false;
    }

    //表示フラグ
    var flag = false;

    if (this.physLab.strobeFlag == true) {

        flag = true;

    } else if (this.physLab.strobeFlag == false) {

        flag = false;

    } else if (this.physLab.strobeFlag == "pause") {

        flag = ( this.physLab.pauseFlag ) ? true : false;

    }

    if (this.physLab.playback.enabled && this.physLab.playback.on) {

        flag = this.physLab.playback.strobeVisible;

    }

    for (var j = 0; j < this.strobe.maxNum; j++) {

        var m = j * this.strobe.skip;

        if (m >= this.data.x.length) break;

        if (this.physLab.pauseFlag && m > this.physLab.timeslider.m) break;

        this.strobe.objects[j].r.x = this.data.x[m][1];
        this.strobe.objects[j].r.y = this.data.y[m][1];
        this.strobe.objects[j].r.z = this.data.z[m][1];
        this.strobe.objects[j].v.x = this.data.vx[m][1];
        this.strobe.objects[j].v.y = this.data.vy[m][1];
        this.strobe.objects[j].v.z = this.data.vz[m][1];
        this.strobe.objects[j].visible = flag && this.strobe.visible;
        this.strobe.objects[j].velocityVector.visible = this.strobe.velocityVectorVisible;

    }

}

////////////////////////////////////////////////////////////////////
//バウンディング球の３次元グラフィックス更新
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.updateBoundingSphere = function () {

    if (!this.boundingSphere.enabled) return;

    //バウンディング球の位置の更新
    this.boundingSphere.CG.position.copy(this.r).add(this.boundingSphere.center);
    this.boundingSphere.CG.visible = this.boundingSphere.visible;
}
////////////////////////////////////////////////////////////////////
// 時間発展の計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.timeEvolution = function () {

    this.beforeTimeEvolution();

    //内部時間ステップのインクリメント
    this.step++;

    //時間間隔の取得
    var dt = this.physLab.dt;
    //力の取得
    var f = this.getForce();

    //接触力がある場合
    if (this.contactForce) {
        f.add(this.contactForce);
    }

    //加速度ベクトルの更新
    //this.a = new THREE.Vector3( ).copy( f ).divideScalar( this.mass );
    this.a.x = f.x / this.mass;
    this.a.y = f.y / this.mass;
    this.a.z = f.z / this.mass;

    //ベルレ法アルゴリズムによる時間発展
    this.computeTimeEvolution(dt);

    //運動の記録
    this.recordDynamicData();

    this.afterTimeEvolution();

}
////////////////////////////////////////////////////////////////////
// ベルレ法アルゴリズムによる時間発展
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.computeTimeEvolution = function (dt) {
    //現時刻の位置ベクトルを一時保存
    //var r_ = new THREE.Vector3( ).copy( this.r );
    var x_ = this.r.x;
    var y_ = this.r.y;
    var z_ = this.r.z;

    //次時刻の位置の計算（ x_{n+1} = 2x_n - x_{n_1} + a_{n}\Delta t^2 ）
    //this.r = this.r.clone( ).multiplyScalar( 2.0 ).sub( this.r_1 ).add( this.a.clone( ).multiplyScalar( dt * dt ) ); 
    this.r.x = 2 * this.r.x - this.r_1.x + this.a.x * dt * dt;
    this.r.y = 2 * this.r.y - this.r_1.y + this.a.y * dt * dt;
    this.r.z = 2 * this.r.z - this.r_1.z + this.a.z * dt * dt;


    //次の時刻の速度の計算（ v_{n+1} = v_n + 2 a_n \Delta t^2 ）
    this.v.x = this.v_1.x + 2 * this.a.x * dt;
    this.v.y = this.v_1.y + 2 * this.a.y * dt;
    this.v.z = this.v_1.z + 2 * this.a.z * dt;

    //衝突時に時間を巻き戻す時に利用する
    this.v_2.x = this.v_1.x;
    this.v_2.y = this.v_1.y;
    this.v_2.z = this.v_1.z;

    //速度の取得（ v_n = ( r_{n+1} - r_{n-1} ) / ( 2\Delta t )  ）
    this.v_1.x = ( this.r.x - this.r_1.x ) / (2 * dt);
    this.v_1.y = ( this.r.y - this.r_1.y ) / (2 * dt);
    this.v_1.z = ( this.r.z - this.r_1.z ) / (2 * dt);

    //別計算で利用する過去の速度ベクトルの保存（v_{n-1}）  
    this.v_2.x = this.v_1.x;
    this.v_2.y = this.v_1.y;
    this.v_2.z = this.v_1.z;

    //衝突時に時間を巻き戻す時に利用する
    this.r_2.x = this.r_1.x;
    this.r_2.y = this.r_1.y;
    this.r_2.z = this.r_1.z;

    //次時刻の計算時に利用する「x_{n_1}」の保存  this.x_1 = x_;
    //this.r_1.copy( r_ );
    this.r_1.x = x_;
    this.r_1.y = y_;
    this.r_1.z = z_;

}

////////////////////////////////////////////////////////////////////
// 力の計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getForce = function () {

    //重力の定義
    var f = new THREE.Vector3(0, 0, -this.mass * this.physLab.g);

    //拘束力の計算
    var bindingForce = this.getBindingForce();

    if (bindingForce) f.add(bindingForce);

    return f;
}

//拘束力の計算
PHYSICS.PhysObject.prototype.getBindingForce = function () {

    //パスが指定されている場合
    if (!this.path.enabled) return;

    //重力加速度ベクトル
    var g = new THREE.Vector3(0, 0, -this.physLab.g);
    //重力の計算
    var Fg = g.multiplyScalar(this.mass);

    //parametricFunctionプロパティ参照用変数
    var _this = this.path.parametricFunction;

    //媒介変数の取得
    var theta = _this.getTheta(_this, this);

    //媒介変数に対する位置ベクトル、接線ベクトル、曲率ベクトルの計算
    var r = _this.position(_this, theta);
    var t = _this.tangent(_this, theta);
    var c = _this.curvature(_this, theta);
    //３次元ベクトルオブジェクトの宣言
    var position = new THREE.Vector3(r.x, r.y, r.z);
    var tangent = new THREE.Vector3(t.x, t.y, t.z);
    var curvature = new THREE.Vector3(c.x, c.y, c.z);

    //経路そのものが運動する場合
    if (this.path.dynamicFunction) {

        var r0 = this.path.line.r;
        var v0 = this.path.line.v;
        var a0 = this.path.line.a;

    } else {

        var r0 = new THREE.Vector3();
        var v0 = new THREE.Vector3();
        var a0 = new THREE.Vector3();

    }
    //３次元オブジェクトの相対速度
    var bar_v = new THREE.Vector3().subVectors(this.v, v0);

    //微係数dl/dtとd^2l/dt^2を計算
    var dl_dt = bar_v.dot(tangent);
    var d2l_dt2 = Fg.dot(tangent) / this.mass - a0.dot(tangent);

    //３次元オブジェクトに加わる力を計算
    var f = a0.clone()
    f.add(tangent.clone().multiplyScalar(d2l_dt2));
    f.add(curvature.clone().multiplyScalar(dl_dt * dl_dt))
    f.multiplyScalar(this.mass);

    //復元力の有無のチェック
    if (this.path.restoringForce.enabled) {

        //ばね定数と減衰係数
        var k_b = ( this.mass * this.physLab.g ) * this.path.restoringForce.k;
        var gamma_b = Math.sqrt(4 * this.mass * this.path.restoringForce.k) * this.path.restoringForce.gamma;

        //復元力の方向ベクトル
        var c1 = curvature.clone().normalize();
        var c2 = new THREE.Vector3().crossVectors(tangent, c1);

        //経路上の位置を平行移動
        position.add(r0);

        //ずれベクトル
        var DeltaL = new THREE.Vector3().subVectors(this.r, position);

        //復元力
        f.add(c1.clone().multiplyScalar(-k_b * c1.dot(DeltaL)));
        f.add(c2.clone().multiplyScalar(-k_b * c2.dot(DeltaL)));

        //復元速度抵抗力
        f.add(c1.clone().multiplyScalar(-gamma_b * c1.dot(bar_v)));
        f.add(c2.clone().multiplyScalar(-gamma_b * c2.dot(bar_v)));

    }

    f.sub(Fg);

    return f;
}

////////////////////////////////////////////////////////////////////
// ベルレ法による必要な初期値の計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.computeInitialCondition = function () {

    if (!this.dynamic) return;

    var dt = this.physLab.dt;
    //力の取得
    f = this.getForce();
    //加速度ベクトルの取得
    this.a = f.clone().divideScalar(this.mass);

    //「x_{-1}」の計算	 this.x_1 = this.x - this.vx * dt + 1 / 2 * this.ax * dt * dt;
    //this.r_1 = new THREE.Vector3( ).copy( this.r ).sub( this.v.clone( ).multiplyScalar( dt ) ).add(  this.a.clone( ).multiplyScalar( 1/2 * dt * dt ) );
    this.r_1.x = this.r.x - this.v.x * dt + 1 / 2 * this.a.x * dt * dt;
    this.r_1.y = this.r.y - this.v.y * dt + 1 / 2 * this.a.y * dt * dt;
    this.r_1.z = this.r.z - this.v.z * dt + 1 / 2 * this.a.z * dt * dt;

    //「v_{n-1}」の計算
    this.v_1.x = this.v.x - this.a.x * dt;
    this.v_1.y = this.v.y - this.a.y * dt;
    this.v_1.z = this.v.z - this.a.z * dt;
}


////////////////////////////////////////////////////////////////////
// 力学的エネルギーの計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getEnergy = function () {

    //速度の大きさの２乗の計算
    var v2 = ( this.step === 0 ) ? this.v.lengthSq() : this.v_1.lengthSq();

    //運動エネルギーの計算
    var kinetic = 1 / 2 * this.mass * v2;

    var z = ( this.step === 0 ) ? this.r.z : this.r_1.z;

    //ポテンシャルエネルギーの計算
    var potential = this.mass * this.physLab.g * z;

    //力学的エネルギーをオブジェクトで返す
    return {kinetic: kinetic, potential: potential};

}

////////////////////////////////////////////////////////////////////
// 位置・速度・エネルギーの時系列データの初期化
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.initDynamicData = function () {
    //配列の初期化
    this.data.x = [];  //x座標
    this.data.y = [];  //y座標
    this.data.z = [];  //z座標
    this.data.vx = []; //速度のx成分
    this.data.vy = []; //速度のy成分
    this.data.vz = []; //速度のz成分
    this.data.kinetic = [];   //運動エネルギー   
    this.data.potential = []; //ポテンシャルエネルギー
    this.data.energy = [];    //力学的エネルギー

    this.data.collisionHistory = []; //衝突履歴
}

////////////////////////////////////////////////////////////////////
// 位置・速度・エネルギーの時系列データの蓄積
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.recordDynamicData = function () {

    var flag = this.recordData;
    if (!this.recordData && this.step == 0) flag = true;
    if (!flag) return;


    if (( this.step == 0 ) || ( this.step / this.skipRecord > this.data.x.length )) {
        var step, x, y, z;

        //初期状態のみ
        if (this.step == 0 || ( !this.dynamic )) {

            step = this.step;
            x = this.r.x;
            y = this.r.y;
            z = this.r.z;

        } else {

            step = this.step - 1;
            x = this.r_1.x;
            y = this.r_1.y;
            z = this.r_1.z;

        }
        //実時刻
        var time = step * this.physLab.dt;

        //位置
        this.data.x.push([time, x]); //x座標
        this.data.y.push([time, y]); //y座標
        this.data.z.push([time, z]); //z座標

        //速度
        this.data.vx.push([time, this.v.x]); //vx
        this.data.vy.push([time, this.v.y]); //vy
        this.data.vz.push([time, this.v.z]); //vz

        //エネルギー
        var energy = this.getEnergy();
        this.data.kinetic.push([time, energy.kinetic]);
        this.data.potential.push([time, energy.potential]);
        this.data.energy.push([time, energy.kinetic + energy.potential]);
    }

}

//運動データの取得
PHYSICS.PhysObject.prototype.getDynamicData = function () {

    if (!this.recordData) return

    var data = {};
    data.x = [];
    data.y = [];
    data.z = [];
    data.vx = [];
    data.vy = [];
    data.vz = [];
    data.kinetic = [];
    data.potential = [];
    data.energy = [];

    for (var i = 0; i < this.data.x.length; i++) {

        var time = this.data.x[i][0];

        data.x.push([time, this.data.x[i][1]]);
        data.y.push([time, this.data.y[i][1]]);
        data.z.push([time, this.data.z[i][1]]);
        data.vx.push([time, this.data.vx[i][1]]);
        data.vy.push([time, this.data.vy[i][1]]);
        data.vz.push([time, this.data.vz[i][1]]);
        data.kinetic.push([time, this.data.kinetic[i][1]]);
        data.potential.push([time, this.data.potential[i][1]]);
        data.energy.push([time, this.data.energy[i][1]]);

    }

    return data;
}


////////////////////////////////////////////////////////////////////
// 通信メソッドの定義
////////////////////////////////////////////////////////////////////

// createメソッド
PHYSICS.PhysObject.prototype.beforeCreate = function () {
    for (var i = 0; i < this.beforeCreateFunctions.length; i++) {
        this.beforeCreateFunctions[i](this);
    }
}
PHYSICS.PhysObject.prototype.afterCreate = function () {
    for (var i = 0; i < this.afterCreateFunctions.length; i++) {
        this.afterCreateFunctions[i](this);
    }
}
// updateメソッド
PHYSICS.PhysObject.prototype.beforeUpdate = function () {
    for (var i = 0; i < this.beforeUpdateFunctions.length; i++) {
        this.beforeUpdateFunctions[i](this);
    }
}
PHYSICS.PhysObject.prototype.afterUpdate = function () {
    for (var i = 0; i < this.afterUpdateFunctions.length; i++) {
        this.afterUpdateFunctions[i]();
    }
}
// timeEvolutionメソッド
PHYSICS.PhysObject.prototype.beforeTimeEvolution = function () {
    for (var i = 0; i < this.beforeTimeEvolutionFunctions.length; i++) {
        this.beforeTimeEvolutionFunctions[i]();
    }
}
PHYSICS.PhysObject.prototype.afterTimeEvolution = function () {
    for (var i = 0; i < this.afterTimeEvolutionFunctions.length; i++) {
        this.afterTimeEvolutionFunctions[i]();
    }
}
//外部から動きを指定する関数
PHYSICS.PhysObject.prototype.dynamicFunction = function () {
    for (var i = 0; i < this.dynamicFunctions.length; i++) {
        this.dynamicFunctions[i]();
    }
}

////////////////////////////////////////////////////////////////////
// 姿勢を表すクォータニオンを計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.initQuaternion = function () {

    //デフォルトの姿勢軸ベクトル
    var hatZ = new THREE.Vector3(0, 0, 1);
    //デフォルトの姿勢軸からの回転角度
    var theta = Math.acos(hatZ.dot(this.axis));
    //姿勢軸回転用の回転軸ベクトルの生成
    var A = new THREE.Vector3().crossVectors(hatZ, this.axis).normalize();
    //姿勢軸回転用のクォータニオンの生成
    var q1 = new THREE.Quaternion().setFromAxisAngle(A, theta);
    //姿勢軸における回転用のクォータニオンの生成
    var q2 = new THREE.Quaternion().setFromAxisAngle(hatZ, this.angle);

    //姿勢を表すクォータニオン
    this.quaternion.multiplyQuaternions(q1, q2);
}

PHYSICS.PhysObject.prototype.resetAttitude = function (axis, angle) {

    //内部プロパティの更新
    this.axis.copy(axis); //姿勢軸ベクトル（Vector3クラス）
    this.angle = angle;     //回転角度

    //クォータニオンの初期化
    this.initQuaternion();
}

////////////////////////////////////////////////////////////////////
// 回転後の姿勢を表すクォータニオンを計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.rotation = function (axis, theta) {
    // axis : THREE.Vector3
    // theta : float

    //姿勢軸回転用のクォータニオンの生成
    var q = new THREE.Quaternion().setFromAxisAngle(axis, theta);

    //姿勢を表すクォータニオン
    this.quaternion.multiply(q);

}

////////////////////////////////////////////////////////////////////
// 各種ベクトルの初期化
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.initVectors = function () {
    //配列の初期化
    this.tangents = [];
    this.vertices = [];
    this.normals = [];

    //各平面に対するベクトルの準備
    for (var i = 0; i < this.faces.length; i++) {
        this.tangents[i] = [];
        this.tangents[i][0] = new THREE.Vector3();
        this.tangents[i][1] = new THREE.Vector3();
        this.normals[i] = new THREE.Vector3();
    }
    //頂点座標をコピー
    for (var i = 0; i < this._vertices.length; i++) {
        this.vertices[i] = new THREE.Vector3().copy(this._vertices[i]);
    }
}

////////////////////////////////////////////////////////////////////
// 移動・回転後の法線ベクトルと接線ベクトルを計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.computeVectors = function () {

    //衝突計算を行わない３次元オブジェクトはスキップ
    if (!this.collision) return;

    //各種ベクトル量の更新の必要性が無い場合はスキップ
    if (!this.dynamic && !this.vectorsNeedsUpdate) return;

    //倍精度の行列要素の生成
    var mv = new THREE.Matrix4d().compose(
        this.r,                   //平行移動（Vector3クラス）
        this.quaternion,          //回転量（Quaternionクラス）
        new THREE.Vector3(1, 1, 1)  //拡大量（Vector3クラス）
    );

    //移動・回転後の頂点ベクトル
    for (var i = 0; i < this.vertices.length; i++) {

        this.vertices[i].copy(this._vertices[i]).applyMatrix4(mv);

    }


    //各面に対する法線ベクトル接線ベクトルを計算
    for (var i = 0; i < this.faces.length; i++) {

        this.tangents[i][0].subVectors(this.vertices[this.faces[i][1]], this.vertices[this.faces[i][0]]);

        if (this instanceof PHYSICS.Polygon) {

            this.tangents[i][1].subVectors(this.vertices[this.faces[i][2]], this.vertices[this.faces[i][0]]);

        } else {//平面の場合（頂点数４）

            this.tangents[i][1].subVectors(this.vertices[this.faces[i][3]], this.vertices[this.faces[i][0]]);

        }

        this.normals[i].crossVectors(this.tangents[i][0], this.tangents[i][1]).normalize();

    }

    //円オブジェクト、円柱オブジェクトの円の中心座標、ポリゴンオブジェクトの各三角形中心座標の計算
    if (this instanceof PHYSICS.Circle || this instanceof PHYSICS.Cylinder || this instanceof PHYSICS.Polygon) {

        this.computeCenterPosition();

    }

    //各種ベクトル量の更新の必要性を解除
    this.vectorsNeedsUpdate = false;
}

////////////////////////////////////////////////////////////////////
// 衝突力の計算
////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getCollisionForce = function () {
    //時間間隔の取得
    var dt = this.physLab.dt;

    var length = this.collisionObjects.length;

    if (length > 0) {

        //衝突時の速度ベクトルの成分
        //var v = new THREE.Vector3( ).subVectors( this.r, r_ ).divideScalar(dt); 
        var vx = ( this.r.x - this.r_1.x ) / dt;
        var vy = ( this.r.y - this.r_1.y ) / dt;
        var vz = ( this.r.z - this.r_1.z ) / dt;
        var v = new THREE.Vector3(vx, vy, vz);

        //連立方程式を保持する配列
        var M = [];

        for (var i = 0; i < length; i++) {
            //２重配列の準備
            M[i] = [];

            var v0 = this.collisionObjects[i].object.v;
            //衝突対象３次元オブジェクトとの相対速度の計算 
            var V = new THREE.Vector3().subVectors(v, v0);

            for (var j = 0; j <= length; j++) {

                var ni = this.collisionObjects[i].dirR;
                var nj = ( j < length ) ? this.collisionObjects[j].dirR : V;

                //i番目の方程式の係数 a_j の値
                M[i][j] = ni.dot(nj);

            }

        }

        //連立方程式を解く
        var A = PHYSICS.Math.solveSimultaneousEquations(M);

        var F = new THREE.Vector3();

        for (var i = 0; i < length; i++) {

            var dirR = this.collisionObjects[i].dirR;
            var object_e = this.collisionObjects[i].object.e;

            if (A[i] > 0) A[i] = 0;

            var beta = -A[i] * (1 + object_e * this.e);

            F.add(dirR.clone().multiplyScalar(this.mass * beta / (dt * 2.0)));
        }

        return F;

    } else {

        return 0;

    }

}

//////////////////////////////////////////////////////////////////////////////////////////
//接触力による力の計算
//////////////////////////////////////////////////////////////////////////////////////////
PHYSICS.PhysObject.prototype.getContactForce = function () {

    var length = this.collisionObjects.length;

    if (length > 0) {

        //物体に加わっている力の取得
        var Fg = this.getForce();

        //連立方程式を保持する配列
        var M = [];

        for (var i = 0; i < length; i++) {
            //２重配列の準備
            M[i] = [];

            for (var j = 0; j <= length; j++) {

                var ni = this.collisionObjects[i].dirR;
                var nj = ( j < length ) ? this.collisionObjects[j].dirR : Fg;

                //i番目の方程式の係数 a_j の値
                M[i][j] = ni.dot(nj);

            }

        }

        //連立方程式を解く
        var A = PHYSICS.Math.solveSimultaneousEquations(M);

        //接触力
        var F = new THREE.Vector3();

        for (var i = 0; i < length; i++) {

            var dirR = this.collisionObjects[i].dirR;
            F.add(dirR.clone().multiplyScalar(-A[i]));

            //接触対象オブジェクトの移動速度
            var v0 = this.collisionObjects[i].object.v;

            //速度ベクトルと法線ベクトルとの内積
            var v0_dot_dirR = v0.dot(dirR);
            var v_dot_dirR = this.v_1.dot(dirR);

            if (Math.abs(v0_dot_dirR) > Math.abs(v_dot_dirR)) {
                var f = this.mass * ( v0_dot_dirR - v_dot_dirR) / ( this.physLab.dt );
                F.add(dirR.clone().multiplyScalar(f));
            }

        }


        return F;

    } else {

        return 0;

    }

}

//衝突時の時間発展の計算
PHYSICS.PhysObject.prototype.timeEvolutionOfCollision = function () {

    //衝突力が無ければ終了
    if (!this.collisionForce) return;

    //時間間隔
    var dt = this.physLab.dt;

    ///////////////////////////////////////////////////
    //衝突直前の位置ベクトルに戻す
    //this.r.copy(r_);
    this.r.x = this.r_1.x;
    this.r.y = this.r_1.y;
    this.r.z = this.r_1.z;

    this.r_1.x = this.r_2.x;
    this.r_1.y = this.r_2.y;
    this.r_1.z = this.r_2.z;

    this.v_1.x = this.v_2.x;
    this.v_1.y = this.v_2.y;
    this.v_1.z = this.v_2.z;

    //力の取得
    var f = this.getForce();

    //衝突力を加味
    f.add(this.collisionForce);

    //接触力を加味
    if (this.contactForce) {
        f.add(this.contactForce);
    }

    //加速度ベクトルの更新
    //this.a = new THREE.Vector3( ).copy( f ).divideScalar( this.mass );
    this.a.x = f.x / this.mass;
    this.a.y = f.y / this.mass;
    this.a.z = f.z / this.mass;

    //時間発展の計算
    this.computeTimeEvolution(dt);

    this.step++;

    //力の取得
    var f = this.getForce();
    //衝突力を加味
    f.add(this.collisionForce);

    //接触力を加味
    if (this.contactForce) {
        f.add(this.contactForce);
    }

    //加速度ベクトルの更新
    //this.a = new THREE.Vector3( ).copy( f ).divideScalar( this.mass );
    this.a.x = f.x / this.mass;
    this.a.y = f.y / this.mass;
    this.a.z = f.z / this.mass;

    //時間発展の計算
    this.computeTimeEvolution(dt);
}

///////////////////////////////////////////////////////////////////////////////////////////////
//各平面の中心座標を計算
PHYSICS.PhysObject.prototype.computeCenterPosition = function () {

    //各平面に対する中心座標を計算
    for (var i = 0; i < this.faces.length; i++) {

        //i番目の面の中心を保持
        this.centerPosition[i] = new THREE.Vector3();

        //全ての座標の平均で中心を取得
        for (var j = 0; j < this.faces[i].length; j++) {

            this.centerPosition[i].add(this.vertices[this.faces[i][j]]);

        }

        this.centerPosition[i].divideScalar(this.faces[i].length);

    }

}

///////////////////////////////////////////////////////////////////////////////////////////////
//各平面のバウンディング球の半径を計算
PHYSICS.PhysObject.prototype.computeFacesBoundingSphereRadius = function () {

    //衝突計算を行わない３次元オブジェクトはスキップ
    if (!this.collision) return;

    for (var i = 0; i < this.faces.length; i++) {

        var max = 0;
        for (var j = 0; j < this.faces[i].length; j++) {

            var v = this._vertices[this.faces[i][j]];
            var l2 = v.distanceToSquared(this.centerPosition[i]);

            if (max < l2) max = l2;
        }

        this.facesBoundingSphereRadius[i] = Math.sqrt(max);
    }

}


///////////////////////////////////////////////////////////////////////////////////////////////
//形状中心座標を計算
PHYSICS.PhysObject.prototype.computeCenterOfGeometry = function () {

    //形状中心座標の初期化
    this.centerOfGeometry = new THREE.Vector3();

    if (this.faces.length > 0) {

        //全表面積
        var S = 0;

        for (var i = 0; i < this.faces.length; i++) {

            var t1 = new THREE.Vector3().subVectors(
                this._vertices[this.faces[i][1]],
                this._vertices[this.faces[i][0]]
            );

            var t2 = new THREE.Vector3().subVectors(
                this._vertices[this.faces[i][2]],
                this._vertices[this.faces[i][0]]
            );

            //各面の面積
            var s = new THREE.Vector3().crossVectors(t1, t2).length();

            //三角形の場合
            if (this.faces[i].length == 3) s = s / 2;

            var center = this.centerPosition[i].clone();

            this.centerOfGeometry.add(center.multiplyScalar(s));

            S += s;

        }

        this.centerOfGeometry.divideScalar(S);

    } else {

        for (var i = 0; i < this._vertices.length; i++) {
            this.centerOfGeometry.add(this._vertices[i]);
        }

        this.centerOfGeometry.divideScalar(this._vertices.length);

    }

}

///////////////////////////////////////////////////////////////////////////////////////////////
//頂点座標を設定
PHYSICS.PhysObject.prototype.setVertices = function (vertices) {

    //初期頂点座標の初期化
    this._vertices = [];

    if (vertices.length > 0) {

        for (var i = 0; i < vertices.length; i++) {
            this._vertices[i] = new THREE.Vector3(vertices[i].x, vertices[i].y, vertices[i].z);
        }

    }

}
///////////////////////////////////////////////////////////////////////////////////////////////
//面指定配列を設定
PHYSICS.PhysObject.prototype.setFaces = function (faces) {

    //面指定配列の初期化
    this.faces = [];

    if (faces.length > 0) {

        for (var i = 0; i < faces.length; i++) {
            //面指定インデックス
            this.faces[i] = [];

            for (var j = 0; j < faces[i].length; j++) {
                this.faces[i][j] = faces[i][j];
            }

        }

    }

}
///////////////////////////////////////////////////////////////////////////////////////////////
//頂点色を設定
PHYSICS.PhysObject.prototype.setColors = function (colors) {

    //初期頂点色の初期化
    this.colors = [];

    if (colors.length > 0) {

        for (var i = 0; i < colors.length; i++) {

            if (colors[i].type === "RGB" || colors[i].type === undefined) {
                this.colors.push(
                    new THREE.Color().setRGB(colors[i].r, colors[i].g, colors[i].b)
                );
            } else if (colors[i].type === "HSL") {
                this.colors.push(
                    new THREE.Color().setHSL(colors[i].h, colors[i].s, colors[i].l)
                );
            } else if (colors[i].type === "HEX") {
                this.colors.push(
                    new THREE.Color().setHex(colors[i].hex)
                );
            }

        }

    }

}
//JSONファイルの読み込み
PHYSICS.PhysObject.prototype.loadJSON = function (filePath) {
    var scope = this;

    //ローダーオブジェクト
    var loader = new THREE.JSONLoader(false);
    //データロードを実行
    loader.load(
        filePath, //ファイルパス
        function (geometry) { //コールバック関数

            //形状オブジェクトから_verticesプロパティとfacesプロパティを与える
            scope.setVerticesAndFacesFromGeometry(geometry);
            //非同期処理の終了
            scope.asynchronous = false;
            //３次元オブジェクトの生成
            scope.physLab.createPhysObject(scope);
            //画像の生成
            scope.makePicture = true;
        }
    );

}
///////////////////////////////////////////////////////////////////////////////////////////////
//形状オブジェクトから_verticesプロパティとfacesプロパティを与える
PHYSICS.PhysObject.prototype.setVerticesAndFacesFromGeometry = function (geometry) {
    var vertices = [];
    var faces = [];

    for (var i = 0; i < geometry.vertices.length; i++) {

        //頂点座標を（x,y,z）→（z,x,y）へローテーション
        if (this.rotationXYZ) {

            vertices[i] = {
                x: geometry.vertices[i].z * this.polygonScale,
                y: geometry.vertices[i].x * this.polygonScale,
                z: geometry.vertices[i].y * this.polygonScale
            }

        } else {

            vertices[i] = {
                x: geometry.vertices[i].x * this.polygonScale,
                y: geometry.vertices[i].y * this.polygonScale,
                z: geometry.vertices[i].z * this.polygonScale
            }

        }

    }

    for (var i = 0; i < geometry.faces.length; i++) {
        faces[i] = [
            geometry.faces[i].a,
            geometry.faces[i].b,
            geometry.faces[i].c
        ];
    }

    //頂点座標の指定
    this.setVertices(vertices);
    //面指定配列の指定
    this.setFaces(faces);

    //各種ベクトルの初期化
    this.initVectors();

    //各三角形の中心座標
    this.centerPosition = [];
    //各三角形の中心座標を計算
    this.computeCenterPosition();

    //形状中心座標
    this.centerOfGeometry = new THREE.Vector3();
    //形状中心座標の計算	
    this.computeCenterOfGeometry();

    //各三角形のバウンディング球の半径
    this.facesBoundingSphereRadius = [];
    //各三角形のバウンディング球の半径を計算
    this.computeFacesBoundingSphereRadius();
}


////////////////////////////////////////////////////////////////////////////////////////////////
// 派生クラス
////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////
// 球クラスの定義
///////////////////////////////////
PHYSICS.Sphere = function (parameter) {
    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //球の半径
    this.radius = parameter.radius || 1.0;

    //基底クラスのコンストラクタの実行
    PHYSICS.PhysObject.call(this, parameter);

    //シェーディング
    this.material.shading = parameter.material.shading || "Smooth";

    //形状オブジェクト
    this.geometry.type = "Sphere";

    //３次元グラフィックスパラメータ
    this.geometry.radius = this.radius;                              //球の半径
    this.geometry.widthSegments = parameter.geometry.widthSegments || 20;  //y軸周りの分割数
    this.geometry.heightSegments = parameter.geometry.heightSegments || 20;  //y軸上の正の頂点から負の頂点までの分割数
    this.geometry.phiStart = parameter.geometry.phiStart || 0;   //y軸回転の開始角度
    this.geometry.phiLength = parameter.geometry.phiLength || Math.PI * 2;//y軸回転角度
    this.geometry.thetaStart = parameter.geometry.thetaStart || 0;    //x軸回転の開始角度
    this.geometry.thetaLength = parameter.geometry.thetaLength || Math.PI;    //x軸回転角度

};
PHYSICS.Sphere.prototype = Object.create(PHYSICS.PhysObject.prototype);
PHYSICS.Sphere.prototype.constructor = PHYSICS.Sphere;


///////////////////////////////////
// 床クラスの定義
///////////////////////////////////
PHYSICS.Floor = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {};
    parameter.material = parameter.material || {};

    //床一辺あたりのタイルの個数
    this.n = parameter.n || 20;

    //タイルの一辺の長さ
    this.width = parameter.width || 1.0;

    //タイルの色
    this.tileColors = parameter.tileColors || [0x999999, 0x333333];

    //床面での跳ね返り
    this.collisionFloor = parameter.collision || parameter.collisionFloor || false;

    //衝突判定用平面の表示
    this.collisionFloorVisible = parameter.collisionFloorVisible || false;

    //基底クラスの継承
    PHYSICS.PhysObject.call(this, parameter);

    //衝突検知の無効化
    this.collision = false;

}
PHYSICS.Floor.prototype = Object.create(PHYSICS.PhysObject.prototype);
PHYSICS.Floor.prototype.constructor = PHYSICS.Floor;

//３次元グラフィックスの生成（オーバーライド）
PHYSICS.Floor.prototype.create3DCG = function () {
    //床オブジェクトの生成
    this.CG = new THREE.Object3D();

    //データ読み込み時にオブジェクトになってしまう場合
    if (!this.tileColors.length) this.tileColors.length = Object.keys(this.tileColors).length;

    for (var i = -this.n / 2; i < this.n / 2; i++) {
        for (var j = -this.n / 2; j < this.n / 2; j++) {
            //位置ベクトル
            var x = ( j + 0.5 ) * this.width;
            var y = ( i + 0.5 ) * this.width;
            //一辺の長さ「width」の正方形の形状オブジェクトの宣言と生成
            var geometry = new THREE.PlaneGeometry(this.width, this.width);

            var parameter = {
                color: this.tileColors[Math.abs(i + j) % this.tileColors.length],
                ambient: this.tileColors[Math.abs(i + j) % this.tileColors.length]
            }
            //市松模様とするための材質オブジェクトを生成
            var material = this.getMaterial(this.material.type, parameter);

            //平面オブジェクトの宣言と生成
            var plane = new THREE.Mesh(geometry, material);
            //平面オブジェクトの位置の設定
            plane.position.set(x, y, 0);
            //平面オブジェクトに影を描画
            plane.receiveShadow = this.material.receiveShadow;
            //平面オブジェクトを床オブジェクトへ追加
            this.CG.add(plane);
        }
    }

    //３次元オブジェクトのマウスドラック
    if (this.draggable) {
        //形状オブジェクトの宣言と生成
        var geometry = new THREE.BoxGeometry(
            this.width * this.n,
            this.width * this.n,
            0.1
        );
        //材質オブジェクトの宣言と生成
        var material = new THREE.MeshBasicMaterial({
            color: this.boundingBox.color,
            transparent: this.boundingBox.transparent,
            opacity: this.boundingBox.opacity
        });
        //バウンディング球オブジェクトの生成
        this.boundingBox.CG = new THREE.Mesh(geometry, material);
        this.boundingBox._center = new THREE.Vector3();
        this.boundingBox.center = new THREE.Vector3();
        this.boundingBox.CG.position.copy(this.r).add(this.boundingBox._center);
        this.boundingBox.CG.visible = this.boundingBox.visible;
        //バウンディング球オブジェクトのシーンへの追加
        this.physLab.CG.scene.add(this.boundingBox.CG);
        this.boundingBox.CG.physObject = this;
    }

    //床面での衝突計算を行う場合
    if (this.collisionFloor) {

        this.children[0] = new PHYSICS.Plane({
            collision: true,    //衝突検知の有無
            width: this.n * this.width,             //横幅
            height: this.n * this.width,             //縦幅
            visible: this.collisionFloorVisible,   //可視化の有無
            axis: this.axis,                      //姿勢軸ベクトル
            angle: this.angle,                    //姿勢軸ベクトルによる回転角 
            e: this.e,                             //反発係数
            material: {
                type: "Basic",   //発光材質
                color: 0xFF0000,  //発光色
                side: "Double",  //両面の描画
            },
        });

        //衝突計算用平面の位置と床オブジェクト位置を一致させる
        this.children[0].r = this.r;

        this.children[0].parent = this;

        //仮想物理実験室へ登録
        this.physLab.objects.push(this.children[0]);
    }

}

///////////////////////////////////
// 軸クラスの定義
///////////////////////////////////
PHYSICS.Axis = function (parameter) {
    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //矢印のサイズ
    this.size = parameter.size || {};
    if (this.size.length === undefined) this.size.length = 3;
    if (this.size.headLength === undefined) this.size.headLength = 1;
    if (this.size.headWidth === undefined) this.size.headWidth = 0.5;

    //矢印の色
    this.axisColors = parameter.axisColors || [0xFF0000, 0x00FF00, 0x0000FF];

    //基底クラスのコンストラクタの実行
    PHYSICS.PhysObject.call(this, parameter);
}
PHYSICS.Axis.prototype = Object.create(PHYSICS.PhysObject.prototype);
PHYSICS.Axis.prototype.constructor = PHYSICS.Axis;

PHYSICS.Axis.prototype.create3DCG = function () {
    //矢印オブジェクトの親オブジェクトの生成
    this.CG = new THREE.Object3D();
    //x軸方向矢印オブジェクトの生成と追加
    this.CG.add(
        new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0), //方向
            new THREE.Vector3(0, 0, 0), //原点
            this.size.length,             //長さ
            this.axisColors[0],         //色
            this.size.headLength,         //矢頭の長さ
            this.size.headWidth           //矢頭の幅
        )
    );
    //y軸方向矢印オブジェクトの生成と追加
    this.CG.add(
        new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0), //方向
            new THREE.Vector3(0, 0, 0), //原点
            this.size.length,             //長さ
            this.axisColors[1],         //色
            this.size.headLength,         //矢頭の長さ
            this.size.headWidth           //矢頭の幅
        )
    );
    //z軸方向矢印オブジェクトの生成と追加
    this.CG.add(
        new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1), //方向
            new THREE.Vector3(0, 0, 0), //原点
            this.size.length,             //長さ
            this.axisColors[2],         //色
            this.size.headLength,         //矢頭の長さ
            this.size.headWidth           //矢頭の幅
        )
    );

    //３次元オブジェクトのマウスドラック
    if (this.draggable) {

        //形状オブジェクトの宣言と生成
        var geometry = new THREE.BoxGeometry(
            this.size.length,
            this.size.length,
            this.size.length
        );

        //材質オブジェクトの宣言と生成
        var material = new THREE.MeshBasicMaterial({
            color: this.boundingBox.color,
            transparent: this.boundingBox.transparent,
            opacity: this.boundingBox.opacity
        });

        //バウンディングボックスオブジェクトの生成
        this.boundingBox.CG = new THREE.Mesh(geometry, material);

        this.boundingBox._center = new THREE.Vector3(
            this.size.length / 2,
            this.size.length / 2,
            this.size.length / 2
        );
        this.boundingBox.center = new THREE.Vector3();


        this.boundingBox.CG.position.copy(this.r).add(this.boundingBox._center);

        this.boundingBox.CG.visible = this.boundingBox.visible;

        //バウンディングボックスオブジェクトのシーンへの追加
        this.physLab.CG.scene.add(this.boundingBox.CG);
        this.boundingBox.CG.physObject = this;
    }
}
///////////////////////////////////
// 平面クラスの定義
///////////////////////////////////
PHYSICS.Plane = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //横幅と縦幅
    this.width = parameter.width || 1.0;
    this.height = parameter.height || 1.0;

    //基底クラスのコンストラクタの実行
    PHYSICS.PhysObject.call(this, parameter);

    //初期頂点座標
    this._vertices[0] = new THREE.Vector3(-this.width / 2, -this.height / 2, 0);
    this._vertices[1] = new THREE.Vector3(this.width / 2, -this.height / 2, 0);
    this._vertices[2] = new THREE.Vector3(this.width / 2, this.height / 2, 0);
    this._vertices[3] = new THREE.Vector3(-this.width / 2, this.height / 2, 0);

    //面指定インデックス
    this.faces[0] = [0, 1, 2, 3];


    //３次元グラフィックスパラメータ
    this.geometry.width = this.width;
    this.geometry.height = this.height;
    this.geometry.widthSegments = parameter.geometry.widthSegments || 1;  //横方向分割数
    this.geometry.heightSegments = parameter.geometry.heightSegments || 1;  //縦方向分割数

    //形状オブジェクト
    this.geometry.type = "Plane";

    //各種ベクトルの初期化
    this.initVectors();
}
PHYSICS.Plane.prototype = Object.create(PHYSICS.PhysObject.prototype);
PHYSICS.Plane.prototype.constructor = PHYSICS.Plane;


///////////////////////////////////
// 立方体クラスの定義
///////////////////////////////////
PHYSICS.Cube = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //横幅と縦幅と奥行き
    this.width = parameter.width || 1;
    this.depth = parameter.depth || 1;
    this.height = parameter.height || 1;

    //Planeクラスのコンストラクタの実行
    PHYSICS.Plane.call(this, parameter);

    //初期頂点座標
    this._vertices[0] = new THREE.Vector3(-this.width / 2, -this.depth / 2, this.height / 2);
    this._vertices[1] = new THREE.Vector3(this.width / 2, -this.depth / 2, this.height / 2);
    this._vertices[2] = new THREE.Vector3(this.width / 2, this.depth / 2, this.height / 2);
    this._vertices[3] = new THREE.Vector3(-this.width / 2, this.depth / 2, this.height / 2);

    this._vertices[4] = new THREE.Vector3(-this.width / 2, -this.depth / 2, -this.height / 2);
    this._vertices[5] = new THREE.Vector3(this.width / 2, -this.depth / 2, -this.height / 2);
    this._vertices[6] = new THREE.Vector3(this.width / 2, this.depth / 2, -this.height / 2);
    this._vertices[7] = new THREE.Vector3(-this.width / 2, this.depth / 2, -this.height / 2);

    //面指定インデックス
    this.faces[0] = [0, 1, 2, 3];
    this.faces[1] = [4, 7, 6, 5];
    this.faces[2] = [3, 7, 4, 0];
    this.faces[3] = [1, 5, 6, 2];
    this.faces[4] = [0, 4, 5, 1];
    this.faces[5] = [2, 6, 7, 3];

    //形状オブジェクト
    this.geometry.type = "Cube";

    //３次元グラフィックスパラメータ
    this.geometry.width = this.width;    //立方体の横幅  （x軸方向）
    this.geometry.depth = this.depth;    //立方体の奥行き （y軸方向）
    this.geometry.height = this.height;  //立方体の高さ   （z軸方向）
    this.geometry.widthSegments = parameter.geometry.widthSegments || 1; //横方向分割数  
    this.geometry.heightSegments = parameter.geometry.heightSegments || 1; //縦方向分割数
    this.geometry.depthSegments = parameter.geometry.depthSegments || 1; //奥行き方向分割数

    //各種ベクトルの初期化
    this.initVectors();
}
PHYSICS.Cube.prototype = Object.create(PHYSICS.Plane.prototype);
PHYSICS.Cube.prototype.constructor = PHYSICS.Cube;


///////////////////////////////////
// 点クラスの定義
///////////////////////////////////
PHYSICS.Point = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //球の半径
    this.radius = parameter.radius = ( parameter.radius !== undefined ) ? parameter.radius : 0.01;


    //Sphereクラスのコンストラクタの実行
    PHYSICS.Sphere.call(this, parameter);

    //材質オブジェクト
    this.material.type = ( parameter.material.type !== undefined ) ? parameter.material.type : "Basic";

    //形状オブジェクト
    this.geometry.type = "Sphere";
    //３次元グラフィックスパラメータ
    this.geometry.radius = this.radius;                                       //球の半径
    this.geometry.widthSegments = parameter.geometry.widthSegments || 20;           //y軸周りの分割数
    this.geometry.heightSegments = parameter.geometry.heightSegments || 20;           //y軸上の正の頂点から負の頂点までの分割数
    this.geometry.phiStart = parameter.geometry.phiStart || 0;            //y軸回転の開始角度
    this.geometry.phiLength = parameter.geometry.phiLength || Math.PI * 2;  //y軸回転角度
    this.geometry.thetaStart = parameter.geometry.thetaStart || 0;            //x軸回転の開始角度
    this.geometry.thetaLength = parameter.geometry.thetaLength || Math.PI;      //x軸回転角度

}
PHYSICS.Point.prototype = Object.create(PHYSICS.Sphere.prototype);
PHYSICS.Point.prototype.constructor = PHYSICS.Point;

///////////////////////////////////
// 円クラスの定義
///////////////////////////////////
PHYSICS.Circle = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //円の半径
    this.radius = ( parameter.radius !== undefined ) ? parameter.radius : 1.0;
    //３次元グラフィックスパラメータ
    this.segments = ( parameter.segments !== undefined ) ? parameter.segments : 40;

    //Planeクラスのコンストラクタの実行
    PHYSICS.Plane.call(this, parameter);

    //初期頂点座標
    this._vertices[0] = new THREE.Vector3(-this.radius, -this.radius, 0);
    this._vertices[1] = new THREE.Vector3(this.radius, -this.radius, 0);
    this._vertices[2] = new THREE.Vector3(this.radius, this.radius, 0);
    this._vertices[3] = new THREE.Vector3(-this.radius, this.radius, 0);

    //面指定インデックス
    this.faces[0] = [0, 1, 2, 3];

    //形状オブジェクト
    this.geometry.type = "Circle"
    //３次元グラフィックスパラメータ
    this.geometry.radius = this.radius;      //円の半径
    this.geometry.segments = this.segments;  //円の分割数
    this.geometry.thetaStart = 0;            //円弧の開始角度
    this.geometry.thetaLength = 2 * Math.PI;  //円弧の終了角度

    //各種ベクトルの初期化
    this.initVectors();

    //円の中心座標
    this.centerPosition = [];
    //円の中心座標を計算
    this.computeCenterPosition();

}
PHYSICS.Circle.prototype = Object.create(PHYSICS.Plane.prototype);
PHYSICS.Circle.prototype.constructor = PHYSICS.Circle;


///////////////////////////////////
// 円柱クラスの定義
///////////////////////////////////
PHYSICS.Cylinder = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}

    //円柱の高さ
    this.height = ( parameter.height !== undefined) ? parameter.height : 1.0;
    //上円の半径
    this.radiusTop = ( parameter.radiusTop !== undefined ) ? parameter.radiusTop : 1.0;
    //下円の半径
    this.radiusBottom = ( parameter.radiusBottom !== undefined ) ? parameter.radiusBottom : 1.0;
    //上下円の開閉
    this.openEnded = ( parameter.openEnded !== undefined ) ? parameter.openEnded : false;

    //円柱の上向きを変更
    this.rotationXYZ = ( parameter.rotationXYZ !== undefined ) ? parameter.rotationXYZ : false;

    //基底クラスのコンストラクタの実行
    PHYSICS.PhysObject.call(this, parameter);

    //３次元グラフィックスパラメータ
    this.material.shading = parameter.material.shading || "Smooth";


    if (!this.rotationXYZ) {

        //初期頂点座標
        this._vertices[0] = new THREE.Vector3(-this.radiusTop, this.height / 2, -this.radiusTop);
        this._vertices[1] = new THREE.Vector3(this.radiusTop, this.height / 2, -this.radiusTop);
        this._vertices[2] = new THREE.Vector3(this.radiusTop, this.height / 2, this.radiusTop);
        this._vertices[3] = new THREE.Vector3(-this.radiusTop, this.height / 2, this.radiusTop);
        this._vertices[4] = new THREE.Vector3(-this.radiusBottom, -this.height / 2, -this.radiusBottom);
        this._vertices[5] = new THREE.Vector3(this.radiusBottom, -this.height / 2, -this.radiusBottom);
        this._vertices[6] = new THREE.Vector3(this.radiusBottom, -this.height / 2, this.radiusBottom);
        this._vertices[7] = new THREE.Vector3(-this.radiusBottom, -this.height / 2, this.radiusBottom);

    } else {

        //初期頂点座標
        this._vertices[0] = new THREE.Vector3(-this.radiusTop, -this.radiusTop, this.height / 2);
        this._vertices[1] = new THREE.Vector3(this.radiusTop, -this.radiusTop, this.height / 2);
        this._vertices[2] = new THREE.Vector3(this.radiusTop, this.radiusTop, this.height / 2);
        this._vertices[3] = new THREE.Vector3(-this.radiusTop, this.radiusTop, this.height / 2);
        this._vertices[4] = new THREE.Vector3(-this.radiusBottom, -this.radiusBottom, -this.height / 2);
        this._vertices[5] = new THREE.Vector3(this.radiusBottom, -this.radiusBottom, -this.height / 2);
        this._vertices[6] = new THREE.Vector3(this.radiusBottom, this.radiusBottom, -this.height / 2);
        this._vertices[7] = new THREE.Vector3(-this.radiusBottom, this.radiusBottom, -this.height / 2);

    }

    //面指定インデックス
    this.faces[0] = [0, 1, 2, 3];
    this.faces[1] = [4, 7, 6, 5];

    //形状オブジェクト
    this.geometry.type = "Cylinder";
    //３次元グラフィックスパラメータ
    this.geometry.radiusTop = this.radiusTop;      //円柱の上の円の半径
    this.geometry.radiusBottom = this.radiusBottom; //円柱の下の円の半径
    this.geometry.height = this.height;             //円柱の高さ
    this.geometry.openEnded = this.openEnded;  //筒状
    this.geometry.radialSegments = parameter.radialSegments || 40; //円の分割数
    this.geometry.heightSegments = parameter.heightSegments || 1,  //円の高さ方向の分割数

        //各種ベクトルの初期化
        this.initVectors();

    //円の中心座標（要素番号：0→上円,1→下円）
    this.centerPosition = [];
    //円の中心座標を計算
    this.computeCenterPosition();
}
PHYSICS.Cylinder.prototype = Object.create(PHYSICS.PhysObject.prototype);
PHYSICS.Cylinder.prototype.constructor = PHYSICS.Cylinder;


///////////////////////////////////
// ポリゴンクラスの定義
///////////////////////////////////
PHYSICS.Polygon = function (parameter) {
    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {};
    parameter.material = parameter.material || {};

    //3次元オブジェクトの形状中心と基準点とを一致させるための頂点座標の再計算実行の有無
    this.resetVertices = parameter.resetVertices || false;

    //JSONファイルパス
    this.loadJSONFilePath = parameter.loadJSONFilePath;
    //頂点座標のスケール
    this.polygonScale = parameter.polygonScale || 1;
    //頂点座標を（x,y,z）→（z,x,y）へローテーション
    this.rotationXYZ = ( parameter.rotationXYZ !== undefined ) ? parameter.rotationXYZ : false;

    //Planeクラスのコンストラクタを継承
    PHYSICS.Plane.call(this, parameter);

    parameter.vertices = parameter.vertices || [
            {x: -5, y: 0, z: 0},
            {x: 0, y: -5, z: 0},
            {x: 0, y: 5, z: 0}
        ];
    parameter.faces = parameter.faces || [
            [0, 1, 2]
        ];

    //頂点座標の指定
    this.setVertices(parameter.vertices);
    //面指定配列の指定
    this.setFaces(parameter.faces);

    //形状オブジェクト
    this.geometry.type = "Polygon";

    //JSONファイルが指定されている場合
    if (parameter.loadJSONFilePath) {
        //非同期フラグ
        this.asynchronous = true;
        //JSONファイルの読み込み
        this.loadJSON(this.loadJSONFilePath);
    }

    //移動・回転後の頂点座標
    this.vertices = [];
    //各種ベクトルの初期化
    this.initVectors();

    //頂点色の指定
    if (this.material.vertexColors) {

        this.setColors(parameter.colors);

    }

    //各面の中心座標
    this.centerPosition = [];
    //三角形の中心座標を計算
    this.computeCenterPosition();

    //形状中心座標
    this.centerOfGeometry = new THREE.Vector3();
    //形状中心座標の計算	
    this.computeCenterOfGeometry();

    //各面のバウンディング球の半径
    this.facesBoundingSphereRadius = [];
    this.computeFacesBoundingSphereRadius();

}
PHYSICS.Polygon.prototype = Object.create(PHYSICS.Plane.prototype);
PHYSICS.Polygon.prototype.constructor = PHYSICS.Polygon;

///////////////////////////////////
// 格子クラスの定義
///////////////////////////////////
PHYSICS.Lattice = function (parameter) {
    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {};
    parameter.material = parameter.material || {};

    //床一辺あたりのタイルの個数
    this.n = parameter.n || 20;

    //タイルの一辺の長さ
    this.width = parameter.width || 0.5;

    //zの値を決める関数
    this.zFunction = parameter.zFunction;

    //Polygonクラスのコンストラクタを実行
    PHYSICS.Polygon.call(this, parameter);

    //初期頂点座標と面指定配列の初期化
    this._vertices = [];
    this.faces = [];

    for (var i = 0; i <= this.n; i++) {
        for (var j = 0; j <= this.n; j++) {
            var x = ( -this.n / 2 + i ) * this.width;
            var y = ( -this.n / 2 + j ) * this.width;
            //初期条件を与える
            var z = 0;
            if (this.zFunction) z = this.zFunction(x, y);
            //頂点座標データの追加
            this._vertices.push(new THREE.Vector3(x, y, z));
        }
    }
    for (var i = 0; i < this.n; i++) {
        for (var j = 0; j < this.n; j++) {
            var ii = ( this.n + 1 ) * i + j;
            //面指定用頂点インデックスを追加
            this.faces.push([ii, ii + ( this.n + 1 ), ii + ( this.n + 1 ) + 1]);
            this.faces.push([ii, ii + ( this.n + 1 ) + 1, ii + 1]);
        }
    }

    //シェーディング
    this.material.shading = parameter.material.shading || "Smooth";

    //各種ベクトルの初期化
    this.initVectors();

    //三角形の中心座標を計算
    this.computeCenterPosition();

}
PHYSICS.Lattice.prototype = Object.create(PHYSICS.Polygon.prototype);
PHYSICS.Lattice.prototype.constructor = PHYSICS.Lattice;

///////////////////////////////////
// 地球クラスの定義
///////////////////////////////////
PHYSICS.Earth = function (parameter) {

    parameter.cloud = parameter.cloud || {};

    this.cloud = {
        mapTexture: parameter.cloud.mapTexture,
        angularVelocity: parameter.cloud.angularVelocity || Math.PI / 5000,
    }

    //Sphereクラスのコンストラクタを実行
    PHYSICS.Sphere.call(this, parameter);

    //外部通信関数へ２つのメソッドを追加
    this.afterCreateFunctions.push(this.createCloud.bind(this));
    this.afterUpdateFunctions.push(this.cloudRotation.bind(this));

};
PHYSICS.Earth.prototype = Object.create(PHYSICS.Sphere.prototype);
PHYSICS.Earth.prototype.constructor = PHYSICS.Earth;

//雲オブジェクトの生成
PHYSICS.Earth.prototype.createCloud = function () {

    //雲テクスチャが適用されていない場合は終了
    if (!this.cloud.mapTexture) return;

    //地球本体の大きさを縮める
    this.CG.scale.set(0.95, 0.95, 0.95);

    //形状オブジェクトの生成
    var geometry = this.getGeometry();

    //材質オブジェクトのパラメータ
    var parameter = {
        mapTexture: this.cloud.mapTexture,
        normalMapTexture: null,
        specularMapTexture: null,
        transparent: true,
        normalMap: null,
        specularMap: null,
    };
    //材質オブジェクトの生成
    var material = this.getMaterial("Lambert", parameter);
    //雲オブジェクトの生成
    this.cloud.CG = new THREE.Mesh(geometry, material);
    //雲オブジェクトの大きさを若干大きく（干渉を防ぐため）
    this.cloud.CG.scale.set(1.01, 1.01, 1.01);
    //地球オブジェクトへ追加
    this.CG.add(this.cloud.CG);

};
//雲の回転
PHYSICS.Earth.prototype.cloudRotation = function () {

    //雲テクスチャが適用されていない場合は終了
    if (!this.cloud.mapTexture) return;

    //雲の回転
    this.cloud.CG.rotation.z += this.cloud.angularVelocity;

};


///////////////////////////////////
// ばねクラスの定義
///////////////////////////////////
PHYSICS.Spring = function (parameter) {
    parameter = parameter || {};

    this.radius = parameter.radius || 1;   //ばねの半径
    this.tube = parameter.tube || 0.2; //管の半径
    this.length = parameter.length || 5;   //ばねの長さ
    this.windingNumber = parameter.windingNumber || 10;  //ばねの巻き数
    this.radialSegments = parameter.radialSegments || 10;  //外周の分割数   
    this.tubularSegments = parameter.tubularSegments || 10;  //管周の分割数

    ///////////////////////////////////
    //円柱オブジェクトのパラメータ
    ///////////////////////////////////

    //円柱の高さ
    parameter.height = this.length + this.tube * 2;
    //上円の半径
    parameter.radiusTop = this.radius + this.tube;
    //下円の半径
    parameter.radiusBottom = this.radius + this.tube;
    //上下円の開閉
    parameter.openEnded = false;

    //上向き
    parameter.rotationXYZ = true;

    //Cylinderクラスを継承
    PHYSICS.Cylinder.call(this, parameter);

    //ばねオブジェクト用にプロパティの上書き
    this.geometry.type = "Spring";
    this.rotationXYZ = false;

}
PHYSICS.Spring.prototype = Object.create(PHYSICS.Cylinder.prototype);
PHYSICS.Spring.prototype.constructor = PHYSICS.Spring;

//ばねの形状オブジェクトを取得
PHYSICS.Spring.prototype.getSpringGeometry = function (radius, tube, length, windingNumber, radialSegments, tubularSegments) {

    //形状オブジェクトの宣言と生成
    var geometry = new THREE.Geometry();

    this.setSpringGeometry(geometry, radius, tube, length, windingNumber, radialSegments, tubularSegments);

    return geometry;

}

//ばねの形状オブジェクトを更新
PHYSICS.Spring.prototype.updateSpringGeometry = function (radius, tube, length, windingNumber, radialSegments, tubularSegments) {

    //形状オブジェクトの宣言と生成
    var geometry = this.CG.geometry;
    geometry.vertices = [];
    geometry.faces = [];

    this.setSpringGeometry(geometry, radius, tube, length, windingNumber, radialSegments, tubularSegments);

    geometry.verticesNeedUpdate = true;
    geometry.normalsNeedUpdate = true;

}

//ばねの形状と姿勢を設定するメソッド
PHYSICS.Spring.prototype.setSpringBottomToTop = function (bottom, top) {

    //ばねオブジェクトの位置ベクトル
    this.r.copy(
        new THREE.Vector3().addVectors(bottom, top).divideScalar(2)
    );

    //ばねオブジェクトの底面中心から上面中心へ向かうベクトル
    var L = new THREE.Vector3().subVectors(top, bottom);

    //ばねオブジェクトの長さを再設定
    this.length = L.length();

    //ばねオブジェクトの姿勢を指定
    this.resetAttitude(
        L.normalize(), //姿勢軸ベクトル
        0              //回転角度
    );

    //ばねの形状オブジェクトの更新
    this.updateSpringGeometry(
        this.radius,         //外円の半径
        this.tube,           //管円の半径
        this.length,         //バネの長さ
        this.windingNumber,  //巻き数
        this.radialSegments, //外周の分割数
        this.tubularSegments //管周の分割数
    );

    /////////////////////////////
    //以下衝突判定に必要なパラメータの再設定

    //円柱の高さ
    this.height = this.length + this.tube * 2;
    //上円の半径
    this.radiusTop = this.radius + this.tube;
    //下円の半径
    this.radiusBottom = this.radius + this.tube;
    //初期頂点座標の設定
    this._vertices[0] = new THREE.Vector3(-this.radiusTop, -this.radiusTop, this.height / 2);
    this._vertices[1] = new THREE.Vector3(this.radiusTop, -this.radiusTop, this.height / 2);
    this._vertices[2] = new THREE.Vector3(this.radiusTop, this.radiusTop, this.height / 2);
    this._vertices[3] = new THREE.Vector3(-this.radiusTop, this.radiusTop, this.height / 2);
    this._vertices[4] = new THREE.Vector3(-this.radiusBottom, -this.radiusBottom, -this.height / 2);
    this._vertices[5] = new THREE.Vector3(this.radiusBottom, -this.radiusBottom, -this.height / 2);
    this._vertices[6] = new THREE.Vector3(this.radiusBottom, this.radiusBottom, -this.height / 2);
    this._vertices[7] = new THREE.Vector3(-this.radiusBottom, this.radiusBottom, -this.height / 2);

    //衝突計算に必要な各種ベクトル量の再計算
    this.vectorsNeedsUpdate = true;

}

//ばねオブジェクトの形状オブジェクトを実質的に計算するメソッド
PHYSICS.Spring.prototype.setSpringGeometry = function (geometry, radius, tube, length, windingNumber, radialSegments, tubularSegments) {

    ///////////////////////////////////////////////////////////////////////////
    //（０）必要な変数の準備
    ///////////////////////////////////////////////////////////////////////////
    radius = radius || 1;   //ばねの半径
    tube = tube || 0.2; //管の半径
    length = length || 5;   //ばねの高さ

    var Nw = windingNumber || 10; //巻き数
    var Nr = radialSegments || 10; //外周分割数
    var Nt = tubularSegments || 10; //管周分割数

    //管断面作成当たりの高さの増分
    var deltaH = length / Nw / Nr;

    ///////////////////////////////////////////////////////////////////////////
    //（１）ばねオブジェクトを構成する頂点座標の取得
    ///////////////////////////////////////////////////////////////////////////
    for (var w = 0; w < Nw; w++) { //巻き番号

        for (var r = 0; r < Nr; r++) { //外周の分割番号

            var phi = 2.0 * Math.PI * r / Nr; //外周の分割番号

            //管断面の中心座標のz成分
            var h = deltaH * ( Nr * w + r);

            for (var t = 0; t < Nt; t++) { //管の分割

                var theta = 2.0 * Math.PI * t / Nt; //管の分割角

                geometry.vertices.push(
                    new THREE.Vector3(
                        ( radius + tube * Math.cos(theta) ) * Math.cos(phi), //x座標
                        ( radius + tube * Math.cos(theta) ) * Math.sin(phi), //y座標
                        tube * Math.sin(theta) + h - length / 2   //z座標
                    )
                );
            }
        }
    }
    ///////////////////////////////////////////////////////////////////////
    //最後の管断面の頂点座標
    var w = Nw;
    var r = 0;
    //管断面の中心座標のz成分
    var h = deltaH * ( Nr * w + r);
    for (var t = 0; t < Nt; t++) {
        var phi = 0.0;
        var theta = 2.0 * Math.PI * t / Nt; //管の分割角
        geometry.vertices.push(
            new THREE.Vector3(
                ( radius + tube * Math.cos(theta) ) * Math.cos(phi), //x座標
                ( radius + tube * Math.cos(theta) ) * Math.sin(phi), //y座標
                tube * Math.sin(theta) + h - length / 2   //z座標
            )
        );

    }
    //最初の管断面の中心座標
    geometry.vertices.push(
        new THREE.Vector3(radius, 0, -length / 2)
    );
    //最後の管断面の中心座標
    geometry.vertices.push(
        new THREE.Vector3(radius, 0, length / 2)
    );


    ///////////////////////////////////////////////////////////////////////////
    //（２）ばねオブジェクトを構成する面指定配列の設定
    ///////////////////////////////////////////////////////////////////////////
    for (var w = 0; w < Nw; w++) { //巻き番号

        for (var r = 0; r < Nr; r++) { //外周分割数
            //巻き番号の指定
            var w1 = w;
            var w2 = ( r !== Nr - 1 ) ? w : w + 1;
            //外周分割番号の指定
            var r1 = r;
            var r2 = ( r !== Nr - 1 ) ? r + 1 : 0;

            for (var t = 0; t < Nt; t++) {  //管分割数
                //管分割番号
                var t1 = t;
                var t2 = ( t !== Nt - 1 ) ? t + 1 : 0;

                //平面を構成する４点の頂点番号の算出
                var v1 = (Nr * Nt) * w1 + Nt * r1 + t1;
                var v2 = (Nr * Nt) * w1 + Nt * r1 + t2;
                var v3 = (Nr * Nt) * w2 + Nt * r2 + t1;
                var v4 = (Nr * Nt) * w2 + Nt * r2 + t2;
                //頂点番号v1,v3,v4を面として指定
                geometry.faces.push(new THREE.Face3(v1, v3, v4));
                //頂点番号v4,v2,v1を面として指定
                geometry.faces.push(new THREE.Face3(v4, v2, v1));
            }
        }
    }

    ///////////////////////////////////////////////////////////////////////
    //最初の管断面の面を指定
    var w = 0
    var r = 0
    for (var t = 0; t < Nt; t++) { //管分割数
        //管分割番号
        var t1 = t;
        var t2 = ( t !== Nt - 1 ) ? t + 1 : 0;

        //管断面の中心座標とその他の２点の頂点番号
        var v1 = (Nr * Nt) * Nw + Nt;
        var v2 = (Nr * Nt) * w + Nt * r + t1;
        var v3 = (Nr * Nt) * w + Nt * r + t2;

        geometry.faces.push(
            new THREE.Face3(v1, v2, v3)
        );
    }

    //最後の管断面の面を指定
    var w = Nw;
    var r = 0;
    for (var t = 0; t < Nt; t++) { //管分割数

        //管分割番号
        var t1 = t;
        var t2 = ( t !== Nt - 1 ) ? t + 1 : 0;

        //管断面の中心座標とその他の２点の頂点番号
        var v1 = Nw * Nr * Nt + Nt + 1;
        var v2 = (Nr * Nt) * w + Nt * r + t1;
        var v3 = (Nr * Nt) * w + Nt * r + t2;

        geometry.faces.push(
            new THREE.Face3(v1, v3, v2)
        );
    }

    //面の法線ベクトルを計算
    geometry.computeFaceNormals();
    //面の法線ベクトルから頂点法線ベクトルの計算
    geometry.computeVertexNormals();

}

///////////////////////////////////
// 線クラスの定義
///////////////////////////////////
PHYSICS.Line = function (parameter) {

    parameter = parameter || {};
    parameter.geometry = parameter.geometry || {}
    parameter.material = parameter.material || {}
    parameter.vertices = parameter.vertices || [
            {x: 0, y: 0, z: 0},
            {x: 0, y: -3, z: 5},
            {x: 0, y: 3, z: 5},
            {x: 0, y: 0, z: 0}
        ];
    parameter.colors = parameter.colors || [];
    parameter.spline = parameter.spline || {};
    parameter.parametricFunction = parameter.parametricFunction || {};

    //スプライン補間のプロパティ
    this.spline = {
        enabled: parameter.spline.enabled || false,  //利用の有無
        pointNum: parameter.spline.pointNum || 0,    //補間点数
    };

    //媒介変数関数のプロパティ
    this.parametricFunction = parameter.parametricFunction || {};

    //頂点座標を格納する配列をcopyPropertyListプロパティに追加するためにここで宣言。
    this.vertices = [];
    this.colors = [];

    //3次元オブジェクトの形状中心と基準点とを一致させるための頂点座標の再計算実行の有無
    this.resetVertices = parameter.resetVertices || false;

    //基底クラスのコンストラクタを実行
    PHYSICS.PhysObject.call(this, parameter);

    //媒介変数関数の必須プロパティの指定
    PHYSICS.overwriteProperty(this.parametricFunction, {
        enabled: parameter.parametricFunction.enabled || false,            //利用の有無
        pointNum: parameter.parametricFunction.pointNum || 100,            //頂点数
        theta: parameter.parametricFunction.theta || {min: 0, max: 1}, //媒介変数の区間
        position: parameter.parametricFunction.position || function (_this, theta) {
            return {x: 0, y: 0, z: 0}
        },        //頂点座標を指定する媒介変数関数
        color: parameter.parametricFunction.color || function (_this, theta) {
            return {type: "RGB", r: 0, g: 0, b: 0}
        }, //頂点色を指定する媒介変数関数
    });

    //媒介変数関数利用の有無を検証
    if (this.parametricFunction.enabled) {

        //媒介変数関数を用いて頂点座標・頂点色を計算
        this.computeVerticesFromParametricFunction();

    } else {

        //スプライン補間の有無を検証
        if (this.spline.enabled) {

            //スプライン補間を用いて頂点座標・頂点色を計算
            this.computeVerticesFromSpline(parameter.vertices, parameter.colors);

        } else {

            //頂点座標の設定
            this.setVertices(parameter.vertices);

            //頂点色の利用時
            if (this.material.vertexColors) {

                //頂点色の設定
                this.setColors(parameter.colors);

            }

        }

    }


    //形状中心座標を計算
    this.computeCenterOfGeometry();


    //形状オブジェクト
    this.geometry.type = "Line";
    //３次元グラフィックスパラメータ
    this.material.type = parameter.material.type || "LineBasic"; //("LineBasic" || "LineDashedMaterial")
    this.material.dashSize = parameter.material.dashSize || 0.2; //破線の実線部分の長さ
    this.material.gapSize = parameter.material.gapSize || 0.2;   //破線の空白部分の長さ

    //各種ベクトルの初期化
    this.initVectors();

}
PHYSICS.Line.prototype = Object.create(PHYSICS.PhysObject.prototype);
PHYSICS.Line.prototype.constructor = PHYSICS.Line;

//媒介変数関数による頂点座標の計算
PHYSICS.Line.prototype.computeVerticesFromParametricFunction = function () {

    var vertices = [];
    var N = this.parametricFunction.pointNum;
    var min = this.parametricFunction.theta.min;
    var max = this.parametricFunction.theta.max;
    for (var i = 0; i <= N; i++) {
        var theta = min + ( max - min ) * i / N;
        vertices.push(this.parametricFunction.position(this.parametricFunction, theta));
    }

    //頂点座標の指定
    this.setVertices(vertices);

    //頂点色の利用時
    if (this.material.vertexColors) {

        var colors = []
        for (var i = 0; i <= N; i++) {
            var theta = min + ( max - min ) * i / N;
            colors.push(this.parametricFunction.color(this.parametricFunction, theta));
        }

        //頂点色の設定
        this.setColors(colors);

    }

}

//スプライン補間による頂点座標の計算
PHYSICS.Line.prototype.computeVerticesFromSpline = function (_vertices, _colors) {

    //スプラインオブジェクトの生成
    this.spline.object = new THREE.Spline(_vertices);

    var vertices = [];
    var N = this.spline.pointNum + _vertices.length - 1;
    for (var i = 0; i <= N; i++) {
        //規格化距離
        var l = i / N;
        //補完点の取得
        var position = this.spline.object.getPoint(l);

        //補完点を頂点座標データとして追加
        vertices.push({x: position.x, y: position.y, z: position.z});
    }
    //頂点座標の指定
    this.setVertices(vertices);


    //頂点色の指定
    if (this.material.vertexColors) {

        var color2vertex = [];
        for (var i = 0; i < _colors.length; i++) {

            if (_colors[i].type === "RGB" || _colors[i].type === undefined) {
                var c = new THREE.Color().setRGB(_colors[i].r, _colors[i].g, _colors[i].b);
            } else if (_colors[i].type === "HSL") {
                var c = new THREE.Color().setHSL(_colors[i].h, _colors[i].s, _colors[i].l);
            } else if (_colors[i].type === "HEX") {
                var c = new THREE.Color().setHex(_colors[i].hex);
            }
            color2vertex.push({x: c.r, y: c.g, z: c.b});
        }

        //スプラインオブジェクトの生成
        var colorSpline = new THREE.Spline(color2vertex);

        var colors = [];
        for (var i = 0; i <= N; i++) {
            //規格化距離
            var l = i / N;
            //補完点の取得
            var color = colorSpline.getPoint(l);

            colors.push({type: "RGB", r: color.x, g: color.y, b: color.z});

        }

        this.setColors(colors);
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//計算ライブラリ

PHYSICS.Math = {};

//直線の方程式の係数の取得（直線の法線ベクトル, 直線の通過する点）
PHYSICS.Math.getLinearEquation = function (normal, point) {  //（Vector2, Vector2）
    var a = normal.x;
    var b = normal.y;
    var c = -a * point.x - b * point.y;
    return {a: a, b: b, c: c}; //（ax+by+c=0）
}

//２次元平面の方程式の取得（平面の法線ベクトル, 平面の通過する点）
PHYSICS.Math.getPlaneEquation = function (normal, point) {  //（Vector3, Vector3）
    var a = normal.x;
    var b = normal.y;
    var c = normal.z;
    var d = -a * point.x - b * point.y - c * point.z;
    return {a: a, b: b, c: c, d: d}; //（ax+by+cz+d=0）
}

//２次元平面の法線ベクトルを取得する（平面の法線ベクトル, 平面の通過する点）
PHYSICS.Math.getTangentVectors = function (normal, point) {  //（Vector3, Vector3）
    var term = PHYSICS.Math.getPlaneEquation(normal, point);
    var a = term.a;
    var b = term.b;
    var c = term.c;
    var d = term.d;

    var tx = new THREE.Vector3(-c, 0, a).normalize();
    var ty = new THREE.Vector3(0, -c, b).normalize();
    var t1 = tx.clone();
    var t2 = new THREE.Vector3(a * b, -a * a - c * c, b * c).normalize();

    return {tx: tx, ty: ty, t1: t1, t2: t2};
}

//２次元空間中の任意の点から直線に下ろした垂線ベクトル（直線のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getPerpendicularVectorFromLinearEquation2 = function (term, position) {  //（{a,b,c}, Vector2）

    //(1)の方法
    var beta = ( term.a * position.x + term.b * position.y + term.c ) / Math.sqrt(term.a * term.a + term.b * term.b);

    var n = new THREE.Vector2(term.a, term.b).normalize();

    var R = n.clone().multiplyScalar(beta);

    return R;

}

//２次元空間中の任意の点から直線に下ろした垂線の足の位置ベクトル（直線のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getFootVectorOfPerpendicularFromLinearEquation2 = function (term, position) {  //（{a,b,c}, Vector2）
    var R = PHYSICS.Math.getPerpendicularVectorFromLinearEquation2(term, position);
    var A = position.clone().sub(R);
    return A;
}

//２次元空間中の任意の点と直線との距離（直線のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getDistanceBetweenPointAndLinearEquation2 = function (term, position) {  //（{a,b,c}, Vector2）
    var R = PHYSICS.Math.getPerpendicularVectorFromLinearEquation2(term, position);
    return R.length();
}


///////////////////////////////////////////////////////////////////////////////////////////
//３次元空間中の任意の点から直線に下ろした垂線ベクトル（直線のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getPerpendicularVectorFromLinear3 = function (vector1, vector2, position) {  //（Vector3, Vector3, position）

    var barR = new THREE.Vector3().subVectors(position, vector1);
    var V = new THREE.Vector3().subVectors(vector2, vector1);

    var barR_dot_V_p_Vsq = barR.dot(V) / V.lengthSq();

    var R = barR.sub(V.multiplyScalar(barR_dot_V_p_Vsq));

    return R;
}

//３次元空間中の任意の点から直線に下ろした垂線の足の位置ベクトル（直線のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getFootVectorOfPerpendicularFromLinear3 = function (vector1, vector2, position) {
    var R = PHYSICS.Math.getPerpendicularVectorFromLinear3(vector1, vector2, position);
    var A = position.clone().sub(R);
    return A;
}

//３元空間中の任意の点と直線との距離（直線上の点１, 直線上の点２, 任意の位置ベクトル）
PHYSICS.Math.getDistanceBetweenPointAndLinear3 = function (vector1, vector2, position) {
    var R = PHYSICS.Math.getPerpendicularVectorFromLinear3(vector1, vector2, position);
    return R.length();
}


///////////////////////////////////////////////////////////////////////////////////////////
//３次元空間中の任意の点から平面に下ろした垂線ベクトル（平面のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getPerpendicularVectorFromPlaneEquation = function (term, position) {  //（{a,b,c,d}, Vector3）
    //(1)の方法
    var gamma = ( term.a * position.x + term.b * position.y + term.c * position.z + term.d ) / Math.sqrt(term.a * term.a + term.b * term.b + term.c * term.c);
    var n = new THREE.Vector3(term.a, term.b, term.c).normalize();
    var R = n.clone().multiplyScalar(gamma);
    return R;

}
//３次元空間中の任意の点から平面に下ろした垂線の足の位置ベクトル（平面のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getFootVectorOfPerpendicularFromPlaneEquation = function (term, position) {
    var R = PHYSICS.Math.getPerpendicularVectorFromPlaneEquation(term, position);
    var A = position.clone().sub(R);
    return A;
}
//３次元空間中の任意の点と平面との距離（平面のパラメータ,任意の位置ベクトル）
PHYSICS.Math.getDistanceBetweenPointAndPlaneEquation = function (term, position) {  //（{a,b,c,d}, Vector3）
    var R = PHYSICS.Math.getPerpendicularVectorFromPlaneEquation(term, position);
    return R.length();
}


///////////////////////////////////////////////////////////////////////////////////////////
//３次元空間中の任意の点から平面に下ろした垂線ベクトル（面の法線ベクトル、面の通過点、任意の位置ベクトル）
PHYSICS.Math.getPerpendicularVectorFromPlane = function (normal, point, position) {
    //２次元平面の方程式の取得（ax+by+cz+d=0）
    var term = PHYSICS.Math.getPlaneEquation(normal, point);
    var R = PHYSICS.Math.getPerpendicularVectorFromPlaneEquation(term, position);
    return R;
}
//３次元空間中の任意の点から平面に下ろした垂線の足の位置ベクトル（面の法線ベクトル、面の通過点、任意の位置ベクトル）
PHYSICS.Math.getFootVectorOfPerpendicularFromPlane = function (normal, point, position) {
    var R = PHYSICS.Math.getPerpendicularVectorFromPlane(normal, point, position);
    var A = position.clone().sub(R);
    return A;
}
//３次元空間中の任意の点から平面までの距離の計算（面の法線ベクトル、面の通過点、任意の位置ベクトル）
PHYSICS.Math.getDistanceBetweenPointAndPlane = function (normal, point, position) {
    var R = PHYSICS.Math.getPerpendicularVectorFromPlane(normal, point, position);
    return R.length();
}
//////////////////////////////////////////////////////////////////////////////////
//３次元空間中の直線との交点の位置ベクトル（平面の法線ベクトル, 平面の通過する点, 直線の方向ベクトル, 直線が通過する点）
PHYSICS.Math.getIntersectionVectorOfLineAndPlaneEquation = function (term, directionVector, linePoint) {  //（Vector3, Vector3, Vector3, Vector3）

    //(2)の方法
    var r0 = linePoint;
    var t = directionVector;

    //法線ベクトルの取得
    var n = new THREE.Vector3(term.a, term.b, term.c).normalize();

    var P = new THREE.Vector3(0, 0, -term.d / term.c);
    var P_m_r0 = new THREE.Vector3().subVectors(P, r0);

    var gamma = n.dot(P_m_r0) / n.dot(t);
    //垂線の足の位置ベクトル
    var A = r0.clone().add(t.clone().multiplyScalar(gamma));
    return A;
}

//３次元空間中の直線との交点の位置ベクトル（平面の法線ベクトル, 平面の通過する点, 直線の方向ベクトル, 直線が通過する点）
PHYSICS.Math.getIntersectionVectorOfLineAndPlane = function (normal, planePoint, directionVector, linePoint) {  //（Vector3, Vector3, Vector3, Vector3）
    //２次元平面の方程式の取得（ax+by+cz+d=0）
    var term = PHYSICS.Math.getPlaneEquation(normal, planePoint);
    var A = PHYSICS.Math.getIntersectionVectorOfLineAndPlaneEquation(term, directionVector, linePoint);
    return A;
}

///////////////////////////////////////////////////////////////////////////////////
//点対称のベクトルを計算（ベクトル, 点）
PHYSICS.Math.getPointSymmetryVector = function (vector, point) {
    var r0 = point.clone();
    var P = vector;
    var Q = r0.multiplyScalar(2).sub(P);
    return Q;
}

//線対称のベクトルを計算（ベクトル, 線方向ベクトル, 線上の点）
PHYSICS.Math.getLineSymmetryVector = function (vector1, vector2, vector) {
    var P = vector;
    //垂線の足ベクトル
    var A = PHYSICS.Math.getFootVectorOfPerpendicularFromLinear3(vector1, vector2, P);
    var Q = A.multiplyScalar(2).sub(P);
    return Q;
}

//面対称のベクトルを計算（ 面の法線ベクトル、面の通過点, ベクトル）
PHYSICS.Math.getPlaneSymmetryVector = function (normal, point, vector) {
    var P = vector.clone();
    //垂線の足ベクトル
    var A = PHYSICS.Math.getFootVectorOfPerpendicularFromPlane(normal, point, P);
    var Q = A.multiplyScalar(2).sub(P);
    return Q;
}


/////////////////////////////////////////////////////////////////////
//ガウス法による連立方程式の解法

PHYSICS.Math.solveSimultaneousEquations = function (M) {

    // 連立数の取得
    var n = M.length;

    // 前進消去（ピボット操作あり）
    for (var k = 0; k < n - 1; k++) {

        var p = k;
        var max = Math.abs(M[k][k]);

        for (var i = k + 1; i < n; i++) {  // ピボット選択
            if (Math.abs(M[i][k]) > max) {
                p = i;
                max = Math.abs(M[i][k]);
            }
        }
        if (Math.abs(max) < 1E-12) {
            var ans = [];
            for (var k = 0; k < n; k++) ans[k] = 0;
            console.log("前進消去時のピボットが小さすぎます（方程式の数が足りない可能性があります）");
            return ans;
        }
        if (p != k) {
            for (var i = k; i <= n; i++) {
                var tmp = M[k][i];
                M[k][i] = M[p][i];
                M[p][i] = tmp;
            }
        }


        for (var i = k + 1; i < n; i++) {
            for (var j = k + 1; j <= n; j++) {
                M[i][j] = M[i][j] - M[k][j] * M[i][k] / M[k][k];
            }
        }
    }

    //連立方程式の解を格納する配列
    var ans = [];
    // 後退代入
    for (var k = n - 1; k >= 0; k--) {
        for (var j = k + 1; j < n; j++) {
            M[k][n] = M[k][n] - M[k][j] * ans[j];
        }
        if (Math.abs(M[k][k]) < 1E-12) {
            console.log("前進消去時のピボットが小さすぎます（方程式の数が多すぎる可能性があります）");
            ans[k] = 0;
        } else {
            ans[k] = M[k][n] / M[k][k];
        }

    }

    return ans;
}

/////////////////////////////////////////////////////////////////////
//倍精度行列
THREE.Matrix4d = function (n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {

    this.elements = new Float64Array(16);

    var te = this.elements;

    te[0] = ( n11 !== undefined ) ? n11 : 1;
    te[4] = n12 || 0;
    te[8] = n13 || 0;
    te[12] = n14 || 0;
    te[1] = n21 || 0;
    te[5] = ( n22 !== undefined ) ? n22 : 1;
    te[9] = n23 || 0;
    te[13] = n24 || 0;
    te[2] = n31 || 0;
    te[6] = n32 || 0;
    te[10] = ( n33 !== undefined ) ? n33 : 1;
    te[14] = n34 || 0;
    te[3] = n41 || 0;
    te[7] = n42 || 0;
    te[11] = n43 || 0;
    te[15] = ( n44 !== undefined ) ? n44 : 1;

};
THREE.Matrix4d.prototype = THREE.Matrix4.prototype; //new THREE.Matrix4();


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//２次元グラフ描画
var Plot2D = function (canvasDom) {
    //ローカル変数
    var plot;
    var plotDatas = [];  //描画用データ
    //デフォルトのオプション
    this.options = {
        //デフォルト軸オプション
        axesDefaults: {
            pad: 1.02,                        //軸の描画範囲のパッディング
            labelRenderer: $.jqplot.CanvasAxisLabelRenderer, //ラベルレンダラーの指定
            labelOptions: {
                show: true,                     //ラベル描画の有無（デフォルト：true）
                angle: -90,                     //ラベル描画角度（デフォルト：-90）
                fontFamily: 'Times New Roman',  //ラベルフォント（デフォルト：'"Trebuchet MS", Arial, Helvetica, sans-serif'）
                fontSize: '20px',               //ラベルフォントサイズ（デフォルト：'11pt'）
                fontWeight: 'bold',             //ラベルウェイト（デフォルト：'nomal'）
                textColor: '#666666'            //ラベルカラー（デフォルト：'#666666'）
            },
            tickRenderer: $.jqplot.CanvasAxisTickRenderer,
            tickOptions: {
                show: true,           //目盛マークと目盛ラベル描画の有無
                showLabel: true,      //目盛ラベル描画の有無
                showMark: true,       //目盛マーク描画の有無
                showGridline: true,   //グリッドラインの描画
                mark: 'outside',      //目盛マークの描画位置の指定（'outside', 'inside' or 'cross'）
                markSize: 4,          //目盛マークのサイズ（デフォルト：4）
                formatString: '',     //フォーマット指定子の設定（例「%.2f」）
                fontSize: '10pt',     //目盛ラベルフォントサイズ
                fontWeight: 'bold',   //目盛ラベルウェイト
                textColor: '#666666', //目盛ラベルカラー
                fontFamily: 'Times New Roman',  //目盛ラベルフォント
                angle: 0,             //目盛ラベル描画角度
                prefix: ''            //目盛ラベルのプレフィックス
            }
        },
        //軸オプション
        axes: {                        //軸のオプション
            xaxis: {                     //x軸のオプション
                label: 'x',                //x軸のラベル
                min: null,                    //x軸の最小値
                max: null,                    //x軸の最大値
                tickInterval: null,        //x軸の目盛間隔
                labelOptions: {angle: 0} //ラベルレンダラオプション
            },
            yaxis: {                     //y軸のオプション
                label: 'y', //y軸のラベル
                min: null,                    //y軸の最小値
                max: null,                  //y軸の最大値
                tickInterval: null,        //y軸の目盛間隔
                renderer: $.jqplot.LinerAxisRenderer,
                labelOptions: {angle: 0} //ラベルレンダラオプション
            },
            y2axis: {                     //y軸のオプション
                label: 'y2', //y軸のラベル
                min: null,                    //y軸の最小値
                max: null,                  //y軸の最大値
                tickInterval: null,        //y軸の目盛間隔
                renderer: $.jqplot.LinerAxisRenderer,
                labelOptions: {angle: 0} //ラベルレンダラオプション
            }
        },
        //グリッドオプション
        grid: {                  //グリッドオプション
            background: '#FFFFFF'  //背景色
        },

        //凡例オプション
        legend: {
            show: true,              //凡例の有無
            location: 'ne',          //凡例の設置場所 'nw'：左上, 'n'：上, 'ne'：右上, 'e'：右, 'se'：右下, 's'：下, 'sw'：左下, 'w'：左
            placement: 'insideGrid'  //凡例の設置場所（デフォルト：'insideGrid'）（値 = 'insideGrid' || 'outsideGrid'）
        },
        //カーソルオプション
        cursor: {
            show: true,                //カーソルの描画
            style: 'crosshair',        //カーソルの種類（デフォルト：'crosshair'）
            zoom: true,                  //ズームの可否（デフォルト：'false'）
            looseZoom: true,             //あいまい値利用の有無（デフォルト：'true'）
            clickReset: true,            //クリックによるズームのリセット有無（デフォルト：'false'）
            dblClickReset: false,        //あいまい値利用の有無（デフォルト：'true'）
            constrainOutsideZoom: false,  //グラフ描画の外側もズーム対象としない（デフォルト：true）
            showTooltipOutsideZoom: true //「constrainOutsideZoom: false」の場合に、ツールチップに外側の値を描画
        },
        //ハイライトオプション
        highlighter: {
            show: true,               //ハイライト描画の有無（デフォルト：true）
            showTooltip: true,        //ツールチップ描画の有無（デフォルト：true）
            tooltipLocation: 'ne',    //ツールチップ描画の方向（デフォルト：'ne'）
            fadeTooltip: true,        //ツールチップフェード描画の有無（デフォルト：true）
            tooltipFadeSpeed: 'def',  //ツールチップフェードの速度（デフォルト：'fast'）（'slow','def','fast', ミリ秒）
            tooltipAxes: 'xy',        //ツールチップに描画うする軸（デフォルト：'xy'）（'x', 'y' , 'xy', 'yx'）
            sizeAdjust: 7.5           //マーカーのサイズ（デフォルト：7.5）
        },
        seriesDefaults: {
            show: true,     // wether to render the series.
            xaxis: 'xaxis', // either 'xaxis' or 'x2axis'.
            yaxis: 'yaxis', // either 'yaxis' or 'y2axis'.
            label: '',      // label to use in the legend for this line.
            color: '',      // CSS color spec to use for the line.  Determined automatically.
            lineWidth: 2.5, // Width of the line in pixels.
            shadow: true,   // show shadow or not.
            shadowAngle: 45,    // angle (degrees) of the shadow, clockwise from x axis.
            shadowOffset: 1.25, // offset from the line of the shadow.
            shadowDepth: 3,     // Number of strokes to make when drawing shadow.  Each
            // stroke offset by shadowOffset from the last.
            shadowAlpha: 0.1,   // Opacity of the shadow.
            showLine: true,     // whether to render the line segments or not.
            showMarker: true,   // render the data point markers or not.
            fill: false,        // fill under the line,
            fillAndStroke: false,       // *stroke a line at top of fill area.
            fillColor: undefined,       // *custom fill color for filled lines (default is line color).
            fillAlpha: undefined,       // *custom alpha to apply to fillColor.
            renderer: $.jqplot.LineRenderer,    // renderer used to draw the series.
            rendererOptions: {}, // options passed to the renderer.  LineRenderer has no options.
            markerRenderer: $.jqplot.MarkerRenderer,    // renderer to use to draw the data
            // point markers.
            markerOptions: {
                show: true,             // wether to show data point markers.
                style: 'filledCircle',  // circle, diamond, square, filledCircle.
                // filledDiamond or filledSquare.
                lineWidth: 2,       // width of the stroke drawing the marker.
                size: 9,            // size (diameter, edge length, etc.) of the marker.
                color: undefined,    // color of marker, set to color of line by default.
                shadow: true,       // wether to draw shadow on marker or not.
                shadowAngle: 45,    // angle of the shadow.  Clockwise from x axis.
                shadowOffset: 1,    // offset from the line of the shadow,
                shadowDepth: 3,     // Number of strokes to make when drawing shadow.  Each stroke
                // offset by shadowOffset from the last.
                shadowAlpha: 0.07   // Opacity of the shadow
            }

        }
    };


    //メソッド１：データ列追加メソッド
    this.pushData = function (data) {
        plotDatas.push(data);  //pushメソッドによる要素の追加
    };

    //メソッド２：グラフ描画メソッド
    this.plot = function () {
        this.linerPlot();
    };

    //グラフ描画メソッド１：線形線形グラフ
    this.linerPlot = function () {
        //描画前にCanvas要素の消去
        this.clearCanvas();

        //線形グラフ描画レンダラーの設定
        this.options.axes.xaxis.renderer = $.jqplot.LinerAxisRenderer;
        this.options.axes.yaxis.renderer = $.jqplot.LinerAxisRenderer;

        //グラフ描画
        plot = $.jqplot(canvasDom, plotDatas, this.options);
    };

    //グラフ描画メソッド２：線形対数グラフ
    this.logPlot = function (base) {
        var base = base || 10; //対数の底（10, 2 or Math.E）

        //描画前の描画データチェック
        this.logPlotDataCheck(false, true);


        //描画前にCanvas要素の消去
        this.clearCanvas();

        //対数グラフ描画レンダラーの設定
        this.options.axes.xaxis.renderer = $.jqplot.LinerAxisRenderer;
        this.options.axes.yaxis.renderer = $.jqplot.LogAxisRenderer;
        this.options.axes.yaxis.tickInterval = null;

        //対数の底の設定
        this.options.axes.yaxis.rendererOptions = {base: base};

        //グラフ描画
        plot = $.jqplot(canvasDom, plotDatas, this.options);
    };

    //グラフ描画メソッド３：対数線形グラフ
    this.loglinerPlot = function (base) {
        var base = base || 10; //対数の底（10, 2 or Math.E）

        //描画前の描画データチェック
        this.logPlotDataCheck(true, false);

        //描画前にCanvas要素の消去
        this.clearCanvas();

        //対数グラフ描画レンダラーの設定
        this.options.axes.xaxis.renderer = $.jqplot.LogAxisRenderer;
        this.options.axes.yaxis.renderer = $.jqplot.LinerAxisRenderer;
        this.options.axes.xaxis.tickInterval = null;

        //対数の底の設定
        this.options.axes.xaxis.rendererOptions = {base: base};

        //グラフ描画
        plot = $.jqplot(canvasDom, plotDatas, this.options);

    };

    //グラフ描画メソッド４：対数対数グラフ
    this.loglogPlot = function (base) {
        var base = base || 10; //対数の底（10, 2 or Math.E）

        //描画前の描画データチェック
        this.logPlotDataCheck(true, true);

        //描画前にCanvas要素の消去
        this.clearCanvas();

        //対数グラフ描画レンダラーの設定
        this.options.axes.xaxis.renderer = $.jqplot.LogAxisRenderer;
        this.options.axes.yaxis.renderer = $.jqplot.LogAxisRenderer;
        this.options.axes.xaxis.tickInterval = null;
        this.options.axes.yaxis.tickInterval = null;

        //対数の底の設定
        this.options.axes.xaxis.rendererOptions = {base: base};
        this.options.axes.yaxis.rendererOptions = {base: base};

        //グラフ描画
        plot = $.jqplot(canvasDom, plotDatas, this.options);

    };

    //メソッド４：Canvas要素消去メソッド
    this.clearCanvas = function () {
        $("#" + canvasDom).empty();
        //document.getElementById(canvasDom).innerHTML = null;
    };

    //メソッド５：グラフ再描画メソッド
    this.replot = function () {
        this.clearCanvas();                       //描画前にCanvas要素の消去

        //描画前の描画データチェック
        if (this.options.axes.yaxis.renderer == $.jqplot.LogAxisRenderer) this.logPlotDataCheck();
        //描画点データの再設定
        for (var i = 0; i < plotDatas.length; i++) plot.series[i].data = plotDatas[i];

        plot.replot();         //内部変数調整用の仮描画
        plot.resetAxesScale(); //軸スケールの再計算
        plot.replot();         //再描画
    };

    //メソッド６：グラフ描画点データの消去
    this.clearData = function () {
        plotDatas = [];  //配列の初期化
    };

    //メソッド７：描画前の描画データチェック
    this.logPlotDataCheck = function (flagX, flagY) {
        flagX = ( flagX === null ) ? false : flagX;
        flagY = ( flagY === null ) ? true : flagY;

        //対数グラフ時の「y<0」となる描画点データの削除
        for (var i = 0; i < plotDatas.length; i++) {  //i番目の描画点データ列
            var _data = []; //一時変数

            //「y>0」の値だけ描画点データを残す
            for (var j = 0; j < plotDatas[i].length; j++) { //i番目の描画点データ列に対するj番目の点
                //plotDatas[i][j][0]とplotDatas[i][j][1]は、i番目の描画点データ列に対するj番目の点のx座標とy座標

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                var flag = false;
                if (flagX && flagY) {

                    if (plotDatas[i][j][0] > 0 && plotDatas[i][j][1] > 0)  flag = true;

                } else if (flagX && !flagY) {

                    if (plotDatas[i][j][0] > 0)  flag = true;

                } else if (!flagX && flagY) {

                    if (plotDatas[i][j][1] > 0)  flag = true;

                } else if (!flagX && !flagY) {

                    flag = true;

                }

                if (flag) _data.push(plotDatas[i][j]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            }

            //i番目の描画点データ列の再設定（これですべての点は「y>0」となる）
            plotDatas[i] = _data;
        }
    };

    //メソッド８：画像データの出力
    this.makeImage = function () {

        //img要素の取得
        var img = $("#" + canvasDom).jqplotToImageElem();

        return img;
    }

    //メソッド９：数値データの出力
    this.makeBlob = function () {

        var spacer = "\t";
        var enter = "\n";

        //出力内容の用意
        var outputs = [];
        for (var i = 0; i < plotDatas[0].length; i++) {

            var data = plotDatas[0][i][0]; //時刻

            for (var j = 0; j < plotDatas.length; j++) {
                data += spacer + plotDatas[j][i][1];
            }

            data += enter;

            outputs.push(data);
        }

        // Blobオブジェクトの生成
        var blob = new Blob(outputs, {"type": "text/plain"});

        return blob;
    }

}


///////////////////////////////////////////////////
//Mathクラスのプロパティ・メソッドを単独定義
//////////////////////////////////////////////////
var E = Math.E;
var LN10 = Math.LN10;
var LN2 = Math.LN2;
var LOG10E = Math.LOG10E;
var LOG2E = Math.LOG2E;
var PI = Math.PI;
var SQRT1_2 = Math.SQRT1_2;
var SQRT2 = Math.SQRT2;

function abs(x) {
    return Math.abs(x);
}
function pow(x, n) {
    return Math.pow(x, n);
}
function acos(x) {
    return Math.acos(x);
}
function asin(x) {
    return Math.asin(x);
}
function atan(x) {
    return Math.atan(x);
}
function atan2(x) {
    return Math.atan2(x);
}
function cos(theta) {
    return Math.cos(theta);
}
function sin(theta) {
    return Math.sin(theta);
}
function tan(theta) {
    return Math.tan(theta);
}
function exp(x) {
    return Math.exp(x);
}
function sqrt(x) {
    return Math.sqrt(x);
}
function exp(x) {
    return Math.exp(x);
}
function exp(x) {
    return Math.exp(x);
}
function log(x) {
    return Math.log(x);
}
