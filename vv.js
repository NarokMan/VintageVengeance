

const Game_states = {
    Menu: "menu",
    Playing: "playing",
    Level_Complete: "level_complete",
    Level_Failed: "level_failed"
};

let level = 0;
let current_game_state = Game_states.Menu;

const WIDTH = 1920;
const HEIGHT = 1080;

let current_time = 0;
let best_time = localStorage.getItem("best_time")
    ? parseFloat(localStorage.getItem("best_time"))
    : null;


let audio = new Audio("backgroundMusic2.mp3");
let squeal = new Audio("squeal.mp3");

function playSound() {

    audio.play();

}

function pauseSound() {

    audio.pause();

}

// Grab the level info from the json file
async function parse_level_info(file_name) {

    const data = await fetch(file_name);
    const config = await data.json();

    setup(config);

}

// Player class
class Player {

    constructor(x, y, w, h, angle, image, wheelbase) {

        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.angle = angle;
        this.dangle = 0;
        this.image = image;
        this.wheelbase = wheelbase;
        this.speed = 0;

        this.center = {x: this.x + this.width / 2, y: this.y + this.height / 2};

        this.corners = [
            {x: this.x, y: this.y}, // top-left
            {x: this.x + this.width / 2, y: this.y}, // top-center
            {x: this.x + this.width, y: this.y}, // top-right
            {x: this.x + this.width, y: this.y + this.height / 2}, // middle-right
            {x: this.x + this.width, y: this.y + this.height}, // bottom-right
            {x: this.x + this.width / 2, y: this.y + this.height}, // bottom-center
            {x: this.x, y: this.y + this.height}, // bottom-left
            {x: this.x, y: this.y + this.height / 2}  // middle-left
        ];

    }

}

// Obstacle class
class Obstacle {
    constructor(x, y, w, h, angle, image) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.angle = angle;
        this.image = image;
        this.xspeed = 0;
        this.yspeed = 0;
    }
}

// Opponent class
class Opponent {

    constructor(x, y, w, h, angle, image, wheelbase, targetx, targety) {

        this.x = x;
        this.y = y;
        this.xspeed = 0;
        this.yspeed = 0;
        this.speed = 0;
        this.width = w;
        this.height = h;
        this.angle = angle;
        this.image = image;
        this.dangle = 0;
        this.wheelbase = wheelbase;

        this.target_angle = 0;
        this.targetx = targetx;
        this.targety = targety;
        this.current_target = 0;

        this.center = {x: this.x + this.width / 2, y: this.y + this.height / 2};

        this.corners = [
            {x: this.x, y: this.y}, // top-left
            {x: this.x + this.width / 2, y: this.y}, // top-center
            {x: this.x + this.width, y: this.y}, // top-right
            {x: this.x + this.width, y: this.y + this.height / 2}, // middle-right
            {x: this.x + this.width, y: this.y + this.height}, // bottom-right
            {x: this.x + this.width / 2, y: this.y + this.height}, // bottom-center
            {x: this.x, y: this.y + this.height}, // bottom-left
            {x: this.x, y: this.y + this.height / 2}  // middle-left
        ];

    }

}

// Draws the main menu
function drawMenu(context, menu_img) {

   context.drawImage(menu_img, 0, 0, WIDTH, HEIGHT);

    if (best_time !== null) {
        context.font = "48px serif";
        context.fillStyle = "white";
        context.fillText("Best Time: " + best_time.toFixed(2) + "s", WIDTH / 2 - 180, HEIGHT / 2);
    }

}

// Initializes the timer and game state at the start of a level
function start_level() {

    level_start_time = performance.now();
    current_time = 0;
    current_game_state = Game_states.Playing;

}

// Clears the screen
function clear_screen(context) {

    context.clearRect(0, 0, WIDTH, HEIGHT);

}

// Draws the background
function draw_bg(context, bg_img) {

    context.drawImage(bg_img, 0, 0);

}

 // Draws an object with rotation
function draw(context, obj) {

    // below is evidently how you rotate images in js
    context.save(); // save how the context is right now
    context.translate(obj.x + obj.width / 2, obj.y + obj.height / 2); // move the entire coordinate system to the center of the monkey
    context.rotate(obj.angle); // rotate the coordinate system about the new origin
    context.drawImage(obj.image, -obj.width / 2, -obj.height / 2, obj.width, obj.height); // draw the monkey on the screwed up coordinate system
    context.restore(); // restore the coordinate system back to how it was when context.save()

}

// Draws the target rectangle
function draw_target(context, target) {

    context.beginPath();
    context.lineWidth = 6;
    context.strokeStyle = target.color;
    context.rect(target.x, target.y, target.width, target.height);
    context.stroke();

}

 // Draws the timer
function draw_timer(context) {

    // Timer drawn top-left (30px from left, 40px/70px from top)
    context.fillStyle = "white";
    context.font = "24px monospace";
    context.fillText("Time: " + current_time.toFixed(2) + "s", 30, 40);

    if (best_time !== null) {
        context.fillText("Best: " + best_time.toFixed(2) + "s", 30, 70);
    }

}

// Draws the level complete screen
function drawLevelComplete(context) {

    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "black";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = "white";
    context.font = "48px serif";
    context.fillText("Level Complete!", WIDTH / 2 - 180, HEIGHT / 2 - 100);
    context.font = "28px serif";
    context.fillText("Your Time: " + current_time.toFixed(2) + "s", WIDTH / 2 - 120, HEIGHT / 2 - 40);

    if (best_time !== null) {
        context.fillText("Best Time: " + best_time.toFixed(2) + "s", WIDTH / 2 - 120, HEIGHT / 2 + 0);
    }

    context.fillText("Press 1 → Next Level", WIDTH / 2 - 120, HEIGHT / 2 + 70);
    context.fillText("Press 2 → Return to Menu", WIDTH / 2 - 140, HEIGHT / 2 + 110);
}

// Draws the level failed screen
function drawLevelFailed(context) {

    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "black";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "red";
    context.font = "48px serif";
    context.fillText("Level Failed!", WIDTH / 2 - 140, HEIGHT / 2 - 100);

    context.font = "28px serif";
    context.fillStyle = "white";
    context.fillText("Press 1 → Retry Level", WIDTH / 2 - 120, HEIGHT / 2 + 10);
    context.fillText("Press 2 → Return to Menu", WIDTH / 2 - 140, HEIGHT / 2 + 50);
}

// Updates numerous player variables
function update_player_pos(player) {

    // adjust the position of the monkey per frame
    player.x += player.speed * Math.cos(player.angle + 3.14 / 2);
    player.y += player.speed * Math.sin(player.angle + 3.14 / 2);

    // adjust the ------angle per frame (see rect_player)
    player.angle += (player.speed / player.wheelbase) * Math.tan(player.dangle);
    player.dangle *= (0.9 - (player.speed / 75));

    player.center = {x: player.x + player.width / 2, y: player.y + player.height / 2};

    const cos = Math.cos(player.angle);
    const sin = Math.sin(player.angle);
    const w = player.width / 2;
    const h = player.height / 2;

    // Collision corners to compare to preggo locations
    player.corners = [

        { x: player.center.x - w * cos + h * sin, y: player.center.y - w * sin - h * cos }, // top-left
        { x: player.center.x + w * cos + h * sin, y: player.center.y + w * sin - h * cos }, // top-right
        { x: player.center.x + w * cos - h * sin, y: player.center.y + w * sin + h * cos }, // bottom-right
        { x: player.center.x - w * cos - h * sin, y: player.center.y - w * sin + h * cos },  // bottom-left
        { x: player.center.x + h * sin, y: player.center.y - h * cos},  // top-center
        { x: player.center.x + w * cos, y: player.center.y + w * sin },  // middle-right
        { x: player.center.x - h * sin, y: player.center.y + h * cos},  // bottom-center
        { x: player.center.x - w * cos, y: player.center.y - w * sin }   // middle-left

    ];

}

function normalize_angle(a) {
    return (a + Math.PI) % (2 * Math.PI) - Math.PI;
}

// Updates numerous opponent variables
function update_opp_pos(opp) {

    opp.speed = Math.sqrt(opp.xspeed * opp.xspeed + opp.yspeed * opp.yspeed);

    // adjust the position of the monkey per frame
    opp.x += opp.speed * Math.cos(opp.angle + 3.14 / 2);
    opp.y += opp.speed * Math.sin(opp.angle + 3.14 / 2);

    // adjust the target angle per frame
    opp.target_angle = Math.atan2(opp.targety - opp.center.y, opp.targetx - opp.center.x) - 3.14 / 2;
    opp.angle += (opp.speed / opp.wheelbase) * Math.tan(opp.dangle);
    opp.dangle *= 0.8;

    let diff = normalize_angle(opp.target_angle - opp.angle);
    opp.angle = normalize_angle(opp.angle);
    opp.target_angle = normalize_angle(opp.target_angle);

    opp.dangle += diff * 0.04;

    opp.xspeed += Math.cos(opp.angle + 3.14 / 2) * 0.01;
    opp.yspeed += Math.sin(opp.angle + 3.14 / 2) * 0.01;

    opp.center = {x: opp.x + opp.width / 2, y: opp.y + opp.height / 2};

    const cos = Math.cos(opp.angle);
    const sin = Math.sin(opp.angle);
    const w = opp.width / 2;
    const h = opp.height / 2;

    opp.corners = [

        { x: opp.center.x - w * cos + h * sin, y: opp.center.y - w * sin - h * cos }, // top-left
        { x: opp.center.x + w * cos + h * sin, y: opp.center.y + w * sin - h * cos }, // top-right
        { x: opp.center.x + w * cos - h * sin, y: opp.center.y + w * sin + h * cos }, // bottom-right
        { x: opp.center.x - w * cos - h * sin, y: opp.center.y - w * sin + h * cos },  // bottom-left
        { x: opp.center.x + h * sin, y: opp.center.y - h * cos},  // top-center
        { x: opp.center.x + w * cos, y: opp.center.y + w * sin },  // middle-right
        { x: opp.center.x - h * sin, y: opp.center.y + h * cos},  // bottom-center
        { x: opp.center.x - w * cos, y: opp.center.y - w * sin }   // middle-left

    ];

}

// Updates numerous preggo variables
function update_preggo_pos(preggos) {

    for (let i = 0; i < preggos.length; i++) {

        preggos[i].x += preggos[i].xspeed;
        preggos[i].y += preggos[i].yspeed;

        preggos[i].xspeed *= 0.95;
        preggos[i].yspeed *= 0.95;

    }

}

// Checks for collision between preggo an d player
function collision_detect(player, obj) {

    for (let i = 0; i < player.corners.length; i++) {

        let dx = player.corners[i].x - (obj.x + obj.width / 2);
        let dy = player.corners[i].y - (obj.y + obj.height / 2 );
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < (obj.width + obj.height) / 4) {

            let angle = Math.atan2(player.center.y - (obj.y + obj.height / 2), player.center.x - (obj.x + obj.width / 2));

            return angle;

        }

    }

    return false;

}

// Checks if opponent has reached its current target node
function opp_node_reached(opp) {

    const dx = opp.center.x - opp.targetx;
    const dy = opp.center.y - opp.targety;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 90) {
        return true;
    }

    return false;

}

// Checks for collision between player and window boundaries
function check_player_window_collision(player) {

    // if player is out of bounds, move it back inside. Then change the speed.
    for (let i = 0; i < player.corners.length; i++) {

        if (player.corners[i].x > WIDTH) {
            player.x -= player.corners[i].x - WIDTH + 1;
            player.speed *= -0.2;
        }

        if (player.corners[i].x < 0) {
            player.x += 1 - player.corners[i].x;
            player.speed *= -0.2;
        }
        
        if (player.corners[i].y > HEIGHT) {
            player.y -= player.corners[i].y - HEIGHT + 1;
            player.speed *= -0.2;
        }

        if (player.corners[i].y < 0) {
            player.y += 1 - player.corners[i].y;
            player.speed *= -0.2;
        }
    }

}



// Gameloop
function animate(context, player, bg, input_keys, level_config, preggos, opponent, menu_img) {

    switch (current_game_state) {

        case Game_states.Menu:
           
            drawMenu(context, menu_img);

            if (input_keys.num_1 == true) { // start game
                current_game_state = Game_states.Playing;
                init_player(player, opponent, preggos, level_config); // reset player position
                start_level();
            }

            break;
        
        case Game_states.Playing:
        
            if (input_keys.up) { // accelerate player and opponent
                player.speed += 0.05;
            }
            if (input_keys.down) { // decelerate player and opponent
                if (player.speed > 0) {
                    player.speed -= 0.1;
                } else 
                    player.speed -= 0.02;
            }
            if (input_keys.left) { // steer left
                if (player.speed > 4)
                    squeal.play();
                player.dangle -= 0.03;
            } else 
                squeal.pause();
            if (input_keys.right) { // steer right
                if (player.speed > 4)
                    squeal.play();
                player.dangle += 0.03;
            } else 
                squeal.pause();

            playSound();

            // check for level complete
            if (overlap_detect(player, level_config.levels[level].target) && player.speed < 0.1) {
                current_game_state = Game_states.Level_Complete;
                current_time = (performance.now() - level_start_time) / 1000;
                
                if (best_time === null || current_time < best_time) {
                    best_time = current_time;
                    localStorage.setItem("best_time", best_time.toString());
                }

            }


            // check for collisions with preggos
            for (let i = 0; i < preggos.length; i++) {
                let angle = collision_detect(player, preggos[i]);
                if (angle != false) {
                    preggos[i].xspeed -= (player.speed / 2) * Math.cos(angle);
                    preggos[i].yspeed -= (player.speed / 2) * Math.sin(angle);

                    player.speed *= 0.7;
                }

                angle = collision_detect(opponent, preggos[i]);
                if (angle != false) {
                    preggos[i].xspeed -= (opponent.speed / 2) * Math.cos(angle);
                    preggos[i].yspeed -= (opponent.speed / 2) * Math.sin(angle);

                    opponent.xspeed *= 0.7;
                    opponent.yspeed *= 0.7;
                }

            }

            for (let i = 0; i < player.corners.length; i++) {
                if (collision_detect(player, opponent)) {
                    let angle = Math.atan2(player.center.y - opponent.center.y, player.center.x - opponent.center.x);
                    opponent.x -= Math.cos(angle) * 1 + Math.cos(angle) * (player.speed * 4);
                    opponent.y -= Math.sin(angle) * 1 + Math.sin(angle) * (player.speed * 4);

                    player.x += Math.cos(angle) * 1 + Math.cos(angle) * (opponent.speed * 8);
                    player.y += Math.sin(angle) * 1 + Math.sin(angle) * (opponent.speed * 8);

                    opponent.xspeed = 0;
                    opponent.yspeed = 0;

                    opponent.speed = 0;

                    player.speed *= 0.7;
                }
            }

            update_player_pos(player); // move car every frame
            update_opp_pos(opponent);
            update_preggo_pos(preggos);
            check_player_window_collision(player);

            // check if opponent reached its target node
            if (opp_node_reached(opponent)) {

                if (opponent.current_target + 1 >= level_config.levels[level].num_nodes) {
                    opponent.xspeed *= 0.82;
                    opponent.yspeed *= 0.82;

                    // if opponent has basically stopped in target zone, player fails level
                    if (opponent.speed < 0.1) {

                        current_game_state = Game_states.Level_Failed;
                        current_time = (performance.now() - level_start_time) / 1000;

                    }

                } else {
                    opponent.current_target++;
                }

                opponent.targetx = level_config.levels[level].opp_nodes[opponent.current_target].x;
                opponent.targety = level_config.levels[level].opp_nodes[opponent.current_target].y;

            }

            clear_screen(context);
            draw_bg(context, bg); // draw the background    
            draw_target(context, level_config.levels[level].target); // draw the target
            draw(context, player); // draw player 
            draw(context, opponent);
            for (let i = 0; i < level_config.levels[level].preggos.length; i++) {
                draw(context, preggos[i]);
            }

            context.strokeStyle = "red";
            context.lineWidth = 4;

            // draw corners
            for (let i = 0; i < player.corners.length; i++) {
                context.beginPath();

                for (let j = 0; j < level_config.levels[level].num_nodes; j++) {
                    context.rect(level_config.levels[level].opp_nodes[j].x, level_config.levels[level].opp_nodes[j].y, 10, 10); // draw target for debugging
                }
                
                context.rect(player.corners[i].x, player.corners[i].y, 2, 2); // draw top-center corner for debugging
                context.stroke();
            }

            current_time = (performance.now() - level_start_time) / 1000; 
            draw_timer(context); // draw timer

            break;

        case Game_states.Level_Complete:

            drawLevelComplete(context);

            pauseSound();

            console.log("STATE:", current_game_state, "1:", input_keys.num_1, "2:", input_keys.num_2);

            if (input_keys.num_1) { // NEXT LEVEL

                level = (level + 1) % level_config.levels.length; // advance level
                bg.src = level_config.levels[level].bg_image;

                current_game_state = Game_states.Playing;
                init_player(player, opponent, preggos, level_config);
                start_level();
                

            }

            if (input_keys.num_2) { // RETURN TO MENU

                current_game_state = Game_states.Menu;

            }

            break;


        case Game_states.Level_Failed:

            drawLevelFailed(context);

            if (input_keys.num_1) { // retry level

                init_player(player, opponent, preggos, level_config);
                start_level();
                current_game_state = Game_states.Playing;

            }

            if (input_keys.num_2) { // menu

                current_game_state = Game_states.Menu;

            }

            break;

        
        default:
            
            break;
    }

    requestAnimationFrame(() => animate(context, player, bg, input_keys, level_config, preggos, opponent, menu_img));
    
}

// Checks for overlap between two rectangles
function overlap_detect(obj1, obj2) {

    if (obj1.x > obj2.x)
        if (obj1.x + obj1.width < obj2.x + obj2.width)
            if (obj1.y > obj2.y)
                if (obj1.y + obj1.height < obj2.y + obj2.height)
                    return true;

    return false;

}

// init player
function init_player(player, opp, preggos, level_config) {

    player.x = level_config.levels[level].player_start.x;
    player.y = level_config.levels[level].player_start.y;
    player.angle = 0;
    player.speed = 0;
    player.dangle = 0;

    opp.x = level_config.levels[level].opponent_start.x;
    opp.y = level_config.levels[level].opponent_start.y;
    opp.angle = 0;
    opp.speed = 0;
    opp.xspeed = 0;
    opp.yspeed = 0;
    opp.dangle = 0;
    opp.current_target = 0;
    opp.targetx = level_config.levels[level].opp_nodes[opp.current_target].x;
    opp.targety = level_config.levels[level].opp_nodes[opp.current_target].y;

    const preggo_img = new Image();
    preggo_img.src = "fatso.png";

    let num_preggos = level_config.levels[level].preggos.length;
    for (let i = 0; i < num_preggos; i++) {
        preggos[i] = new Obstacle(
            level_config.levels[level].preggos[i].x, 
            level_config.levels[level].preggos[i].y, 
            50, 50, 0, preggo_img);
    }

    return player;

}

// Sets up the game environment and starts the animation loop
function setup(level_config) {

    const canvas = document.getElementById("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const scaleX = canvas.width / WIDTH;
    const scaleY = canvas.height / HEIGHT;

    const ctx = canvas.getContext("2d");

    const scale = Math.min(scaleX, scaleY);
    ctx.scale(scale, scale);

    const bg_img = new Image();
    bg_img.src = level_config.levels[level].bg_image;

    const car_img = new Image();
    car_img.src = "topdowncar.png";

    const opp_img = new Image();
    opp_img.src = "oppcar1.png";

    const preggo_img = new Image();
    preggo_img.src = "fatso.png";

    const menu_img = new Image();
    menu_img.src = "Menu.png";

    const preggos = [];
    let num_preggos = level_config.levels[level].preggos.length;
    for (let i = 0; i < num_preggos; i++) {
        preggos[i] = new Obstacle(
            level_config.levels[level].preggos[i].x, 
            level_config.levels[level].preggos[i].y, 
            50, 50, 0, preggo_img);
    }

    const player = new Player (
        50,
        50,
        100,
        200,
        0,
        car_img,
        45
    );

    const opponent = new Opponent (
        300,
        300,
        75,
        165,
        0,
        opp_img,
        25,
        level_config.levels[level].opp_nodes[level].x,
        level_config.levels[level].opp_nodes[level].y
    );

    const input_keys = { 
        up: false, 
        down: false, 
        left: false, 
        right: false,
        enter: false,
        num_1: false,
        num_2: false
    };

    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'ArrowLeft':
                input_keys.left = true;
                break;
            case 'ArrowRight':
                input_keys.right = true;
                break;
            case 'ArrowUp':
                input_keys.up = true;
                break;
            case 'ArrowDown':
                input_keys.down = true;
                break;
            case 'Enter':
                input_keys.enter = true;
                break;
            case '1':
                input_keys.num_1 = true;
                break;
            case '2':
                input_keys.num_2 = true;
                break;
        }
    });

    document.addEventListener('keyup', function(event) {
        switch (event.key) {
            case 'ArrowLeft':
                input_keys.left = false;
                break;
            case 'ArrowRight':
                input_keys.right = false;
                break;
            case 'ArrowUp':
                input_keys.up = false;
                break;
            case 'ArrowDown':
                input_keys.down = false;
                break;
            case 'Enter':
                input_keys.enter = false;
                break;
            case '1':
                input_keys.num_1 = false;
                break;
            case '2':
                input_keys.num_2 = false;
                break;
        }
    });

    canvas.addEventListener("mousemove", function (event) {
        const rect = canvas.getBoundingClientRect();

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        console.log("Mouse:", mouseX, mouseY);
    });

    requestAnimationFrame(() => animate(ctx, player, bg_img, input_keys, level_config, preggos, opponent, menu_img));

}

parse_level_info("level.json");