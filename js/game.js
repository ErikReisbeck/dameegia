    import * as THREE from './three.js-master/build/three.module.js';
    import { OrbitControls } from './three.js-master/examples/jsm/controls/OrbitControls.js';
    import { GLTFLoader } from './three.js-master/examples/jsm/loaders/GLTFLoader.js';

    var scene, camera, renderer, cube, controls, draughts, board, mouse, raycaster, selectedPiece = null, move;

    function init() {
        draughts = new Draughts();

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        mouse = new THREE.Vector2();
        raycaster = new THREE.Raycaster();

        const square = new THREE.BoxGeometry(1, 0.1, 1);
        const lightsquare = new THREE.MeshBasicMaterial( { color: 0xE0C4A8 } );
        const darksquare = new THREE.MeshBasicMaterial( { color: 0x6A4236 } );

        board = new THREE.Group();

        let squareNumber = 1;
        for (let z = 0; z < 10; z++) {
            for (let x = 0; x < 10; x++) {
            let cube;
            if (z % 2 != 0) {
                cube = new THREE.Mesh(square, x % 2 == 0 ? darksquare : lightsquare);
                if (x % 2 == 0) {
                cube.userData.squareNumber = squareNumber;
                squareNumber++;
                }
            } else {
                cube = new THREE.Mesh(square, x % 2 == 0 ? lightsquare : darksquare);
                if (x % 2 != 0) {
                cube.userData.squareNumber = squareNumber;
                squareNumber++;
                }
            }

            cube.position.set(x, 0, z);
            board.add(cube);
            }
        }

        scene.add(board);

        const loader = new GLTFLoader();
        loader.load('./checker.glb', function (gltf) {
            const checkerMesh = gltf.scene.children.find((child) => child.name === "Checker");
            checkerMesh.scale.set(checkerMesh.scale.x * 0.4, checkerMesh.scale.y * 0.4, checkerMesh.scale.z * 0.4);
            checkerMesh.position.y += checkerMesh.scale.y;
            addCheckers(checkerMesh);
        });

        const light = new THREE.PointLight(0xffffff, 2, 200);
        light.position.set(4.5, 10, 4.5);
        scene.add(light);

        camera.position.y = 1;
        camera.position.z = 3;

        controls = new OrbitControls(camera, renderer.domElement);

        controls.target.set(4.5, 0, 4.5);

        controls.enablePan = false;
        controls.maxPolarAngle = Math.PI / 2;

        controls.enableDamping = true;

        window.requestAnimationFrame(animate);
    }

    function positionForSquare(square) {
        const found = board.children.find((child) => child.userData.squareNumber == square);
        if (found) {
            return found.position;
        } else {
            return null;
        }
    }

    function addCheckers(checkerMesh) {
        for (let i = 0; i < 51; i++) {
            let pieceOn = draughts.get(i);
            const piece = checkerMesh.clone(true);
            const squarePosition = positionForSquare(i);

            if (pieceOn === 'b') {
                piece.material = new THREE.MeshStandardMaterial( { color: 0x222222 } );
                piece.userData.color = 'b';
                piece.userData.currentSquare = i;
                piece.position.set(squarePosition.x, piece.position.y, squarePosition.z);
                scene.add(piece);
            } else if (pieceOn === 'w') {
                piece.material = new THREE.MeshStandardMaterial( { color: 0xEEEEEE } );
                piece.userData.color = 'w';
                piece.userData.currentSquare = i;
                piece.position.set(squarePosition.x, piece.position.y, squarePosition.z);
                scene.add(piece);
            }
        }
    }

    function resetMaterials() {
        for (let i = 0; i < scene.children.length; i++) {
            if (scene.children[i].material) {
                scene.children[i].material.opacity = scene.children[i].userData.currentSquare == selectedPiece ? 0.5 : 1.0; 
            }
        }
    }

    function hoverPieces() {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);
        for (let i = 0; i < intersects.length; i++) {
            intersects[i].object.material.transparent = true;
            intersects[i].object.material.opacity = 0.5;
        }
    }

    function animate() {
        controls.update();
        resetMaterials();
        hoverPieces();
        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function onMouseMove(event) {

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
    
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
    }

    function onClick(event) {
        console.log(draughts.ascii());
        raycaster.setFromCamera(mouse, camera);
        let intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
            selectedPiece = intersects[0].object.userData.currentSquare;
            return;
        }

        if (selectedPiece) {
            raycaster.setFromCamera(mouse, camera);
            intersects = raycaster.intersectObjects(board.children);

            if (intersects.length > 0 && intersects[0].object.userData.squareNumber) {
                const targetSquare = intersects[0].object.userData.squareNumber;
                const selectedObject = scene.children.find((child) => child.userData.currentSquare == selectedPiece);
                if (!selectedObject || !targetSquare) {
                    return;
                }
                const targetPosition = positionForSquare(targetSquare);
                selectedObject.position.set(targetPosition.x, selectedObject.position.y, targetPosition.z);
                //scene.remove(selectedObject);
                selectedObject.currentSquare = targetSquare;
                
                console.log(draughts.move({from: selectedPiece, to: targetSquare}));
                draughts.remove(selectedPiece);
                draughts.remove
                console.log(draughts.moves());
                selectedPiece = null;
            }
        }
    }

    window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('click', onClick);
    window.onload = init;