/* The project consists in creating a maze-puzzle game
 * 
 *  The field consists in a 2D array which contains the maze where
 * the player travels around.
 *  The field has the following characters:
 *      * Field ░
 *      * Path *
 *      * Player P
 *      * Holes O
 *      * Hat ^
 * 
 *   The player starts at a random position and must find his hat (^)
 *  He is leaving a tray behind him in form of a path (*) and can travel 
 *  through the field (░). But must be careful not to fall into a hole (O)
 * 
 *   The game ends when the player:
 *      * Wins by finding his hat
 *      * Loses by landing on (and falling in) a hole
 *      * Attempts to move outside the field
 * 
 */

// Module to let user input strings
const prompt = require('prompt-sync')({sigint: true});

// Characters found in the map
const hatCharacter = '^';
const holeCharacter = 'O';
const fieldCharacter = '░';
const pathCharacter = '*';
const playerCharacter = 'P';

/** The board where player will be traveling around */
class Field {
    /** Create a field 
     * @param {number[][]} map - The map containing the characters
     * @param {{X: number, Y: number}} start - The starting position
     * @param {{X: number, Y: number}[]} holes - The holes position
     * @param {{X: number, Y: number}} end - The ending position
    */
    constructor(map,start,holes,end){
        this._map = map;
        this._start = start;
        this._holes = holes;
        this._end = end;
    }
    get start(){
        return this._start;
    }
    get holes(){
        return this._holes;
    }
    get end(){
        return this._end;
    }

    get map(){
        return this._map;
    }

    get height(){
        return this.map.length;
    }

    get width(){
        return this.map[0].length;
    }

    /** Logs a string representation of the map */
    print(){
        let mapString = '';
        this.map.forEach(row => {
            row.forEach( col => {
                mapString += col;
            })
            mapString += '\n';
        });
        console.log(mapString);
    }

    /** Gets the value from the X and Y position of the field
     * @param {number} X - The x value.
     * @param {number} Y - The y value.
     */
    getXY(X,Y){
        return this._map[Y][X];
    }


    /** Sets the value into the X and Y position of the field
     * @param {number} X - The x value.
     * @param {number} Y - The y value.
     * @param {*} value - The assigned value.
     */
    setXY(X,Y,value){
        this._map[Y][X] = value;
    }

    /** Returns the coordinates of an available field position
     * @param {number} X - The x value.
     * @param {number} Y - The y value.
     * @return {{X: number, Y: number}} Available path coordinates.
     */
    availablePath(){
        let path;
        do{
            path = Field.randomCoordinates(this.height,this.width);
        }while(this.getXY(path.X,path.Y) !== fieldCharacter);
        return path;
    }

    /** Returns a random coordinate from inside a 2D array
     * @param {number} height - The hight of the array.
     * @param {number} width - The width of the array.
     * @return {{X: number, Y: number}} The coordinate.
     */
    static randomCoordinates(height,width){
        const X = Math.floor(Math.random()*width);
        const Y = Math.floor(Math.random()*height);
        return {X,Y};
    }

    /** Generates an array with only field characters
     * @param {number} height - The hight of the array.
     * @param {number} width - The width of the array.
     * @return {string[]} The blank map.
     */
    static generateBlankMap(height,width){
        const map = [];
        for(let h=0; h<height; h++){
            const row = [];
            for(let w=0; w<width; w++){
                row.push(fieldCharacter);
            }
            map.push(row);
        }
        return map;
    }

    /** Generates a random field with the specified characteristics
     * @param {number} height - The hight of the field.
     * @param {number} width - The width of the field.
     * @param {number} [percentage=30] - Percentage of holes in the field (0-50)
     * @return {Field} Random field generated.
     */
    static generateField(height,width,percentage=30){
        const field = new Field();
        const numberOfHoles = Math.floor(height*width*percentage/100);

        field._map = Field.generateBlankMap(height,width);

        field._start = field.availablePath();
        field._map[field._start.Y][field._start.X] = playerCharacter;

        field._holes = [];
        for(let i=0; i<numberOfHoles;i++){
            const hole = field.availablePath();
            field.setXY(hole.X,hole.Y,holeCharacter);
            field._holes.push(hole);
        }
        
        field._end = field.availablePath();
        field._map[field._end.Y][field._end.X] = hatCharacter;

        return field;
    }

    /** Turns a field into its numeric representation (used mainly for bots)
     * @param {Field} field - Field to turn into numeric
     * @return {Field} Field with a numeric map representation.
     */
    static convertToNumeric(field){

        /* The generated map will have a border of holes to restrict 
         *bots getting out of bounds.
         *
         * That is why the for loop starts from-1 and ends at its limits.
         * 
         * Path not traveled = 0
         * Path traveled = 1
         * Holes or dead end = 2
         */

        const map = [];
        for(let row=-1; row<=field.height;row++){
            const rowArray = [];
            for(let col=-1; col<=field.width;col++){
                
                //If in the border add holes else turn field into numeric
                if( row===-1 || row===field.height ||
                    col===-1 || col===field.width){
                    rowArray.push( 2 );
                }
                else{
                    rowArray.push( (field.getXY(col,row)===holeCharacter)?2:0 );
                }
            }
            map.push(rowArray);
        }

        // The values of start, holes and end must be increased by one
        // because a border has been added to the map.

        const start = {
            X: field.start.X+1, 
            Y: field.start.Y+1
        };

        const holes = [];
        field.holes.forEach( hole => {
            holes.push({
                X: hole.X+1,
                Y: hole.Y+1
            });
        });

        const end = {
            X: field.end.X+1,
            Y: field.end.Y+1
        };

        return new Field(map,start,holes,end); // Return field with the numeric map

    }

    /** Returns true if the field can be solved
     * @param {Field} field - Field to check
     */
    static isSolvable(field){

        // Create game with field numeric representation to simulate
        const botGame = new Game(Field.convertToNumeric(field));
        const botField = botGame.field;
        const bot = botGame.player;

        // Simulate game with a bot to solve the field
        while(true){

            // The values around the bot are added to determine how
            //to aproach with the current possition of the bot
            const sum = botField.getXY(bot.X,bot.Y-1) +
            botField.getXY(bot.X,bot.Y+1) +
            botField.getXY(bot.X-1,bot.Y) + 
            botField.getXY(bot.X+1,bot.Y);

            /* What to do with current position depending of surrondings */

            // If the bot is currently at the end position return true
            //(Can be solved).
            if( bot.X-1 === field.end.X && bot.Y-1 === field.end.Y){
                return true;
            }
            // If the bot is around holes or dead ends return false
            //(Can not be solved).
            else if( sum === 8 ){
                return false;
            }
            // If the bot is surrounded by holes or dead ends 
            //turn current position to dead end.
            else if( sum === 7 ){
                botField.setXY(bot.X,bot.Y,2);
            }
            // If bot has travelled through here and top and right positions 
            //share the same value turn current position to dead end.
            else if( sum === 6 && botField.getXY(bot.X,bot.Y-1) === botField.getXY(bot.X+1,bot.Y) ){
                botField.setXY(bot.X,bot.Y,2);
            }
            // If bot is not surronded by holes, dead ends and paths travelled through
            //turn current position into travelled path
            else{
                botField.setXY(bot.X,bot.Y,1);
            }

            /* Bots movement simulated next */

            // If bot has not been into a position in field (0) go there
            //if not travel somewhere it has been before

            // Give priority to up and right as this will allow us to
            //get the must cases where top and right are the same and sum = 6

            if( botField.getXY(bot.X,bot.Y-1) === 0 ){
                bot.up();
            }
            else if( botField.getXY(bot.X+1,bot.Y) === 0 ){
                bot.right();
            }
            else if( botField.getXY(bot.X-1,bot.Y) === 0 ){
                bot.left();
            }
            else if( botField.getXY(bot.X,bot.Y+1) === 0 ){
                bot.down();
            }
            else if( botField.getXY(bot.X,bot.Y-1) === 1 ){
                bot.up();
            }
            else if( botField.getXY(bot.X+1,bot.Y) === 1 ){
                bot.right();
            }
            else if( botField.getXY(bot.X-1,bot.Y) === 1 ){
                bot.left();
            }
            else if( botField.getXY(bot.X,bot.Y+1) === 1 ){
                bot.down();
            }
        }
    }


    /** Returns a field that can be solved and the difference between the
     * start and end is more than half of the field's size. (Tries just 100 fields).
     * If not field is found then throws an error.
     * @param {number} height - The hight of the field.
     * @param {number} width - The width of the field.
     * @param {number} [percentage=30] - Percentage of holes in the field (0-50)
     * @return {Field} Solvable random field generated.
     */
    static generateSolvableField(height,width,percentage=30){
        let field, diffX, diffY, i = -1;

        do{
            i++;
            field = Field.generateField(height,width,percentage);
            diffX = Math.abs(field.start.X-field.end.X);
            diffY = Math.abs(field.start.Y-field.end.Y);
        }while( i<100 && (diffX < width/2 || diffY < height/2 || !Field.isSolvable(field)));
        
        if( i!==100 ){
            return field;
        }
        else{
            throw Error("Solvable Map not found");
        }
    }
}


/** The player */
class Player{
    /** Create a player by its position
     * @param {number} X - x position of the player
     * @param {number} Y - y position of the player
    */
    constructor(X,Y){
        this._X = X;
        this._Y = Y;
    }

    get X(){
        return this._X;
    }

    get Y(){
        return this._Y;
    }

    set X(x){
        this._X = x;
    }

    set Y(y){
        this._Y = y;
    }

    /**Moves Player up one position */
    up(){
        this.Y--;
    }

    /**Moves Player down one position */
    down(){
        this.Y++;
    }

    /**Moves Player left one position */
    left(){
        this.X--;
    }

    /**Moves Player right one position */
    right(){
        this.X++;
    }
}

/** The game class which contains the field and player and allows interactions with each other*/
class Game {
    /** Create a game
     * @param {Field} field - The field where the player will be moving
    */
    constructor(field){
        this._field = field;
        this._player = new Player(field.start.X,field.start.Y);
    }

    get field(){
        return this._field;
    }

    get player(){
        return this._player;
    }

    /** Returns true if player is out of the field */
    playerOutOfBounds(){
        return ( this.player.X < 0 || this.player.X >= this.field.width ||
                 this.player.Y < 0 || this.player.Y >= this.field.height );
    }

    /** Returns true if player finds the hat */
    playerInHat(){
        return this.field.getXY(this.player.X,this.player.Y) === hatCharacter;
    }

    /** Returns true if the player fell into a hole */
    playerInHole(){
        return this.field.getXY(this.player.X,this.player.Y) === holeCharacter;
    }

    /** Updates the field to change the current players position into a path '*' */
    updateFieldPath(){
        this.field.setXY(this.player.X,this.player.Y,pathCharacter);
    }

    /** Updates the field to change the current players position into a player 'P' */
    updateFieldPlayer(){
        this.field.setXY(this.player.X,this.player.Y,playerCharacter);
    }

    /** Starts the game */
    play(){
        let gameOver = false;
    
        console.log('Move with WASD and press Enter\n');

        /* Keep playing until game is over */
        while(!gameOver){
        
            this.updateFieldPlayer(); // Set new position into player

            this.field.print(); // Print field
            const instr = prompt('Which way? '); // Wait for user input

            this.updateFieldPath() // Set previous position into path

            /* Choose where to move depending on user input */
            switch(instr.toUpperCase()){
                case 'W': this.player.up();       break;
                case 'A': this.player.left();     break;
                case 'S': this.player.down();     break;
                case 'D': this.player.right();    break;
                default: console.log('Move with WASD');
            }

    
            /* Game finishes when any of the conditions are true */
            if(this.playerOutOfBounds()){
                console.log('Player out of bounds');
                gameOver = true;
            }
            else if(this.playerInHole()){
                console.log('Sorry, you fell down a hole.');
                gameOver = true;
            }
            else if(this.playerInHat()){
                console.log('Congrats, you found your hat.');
                gameOver = true;
            }
        }
    }
}

const game = new Game(Field.generateSolvableField(15,15,30)); // Create new game
game.play();    // Start game