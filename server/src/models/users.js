const mongoose= require('mongoose');
const bcrypt= require('bcryptjs');

const userSchema= new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please provide a valid email address'
        ]
    },
    password:{
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    }
},{timestamps: true});

// Hash password before saving (only if password field was modified)
userSchema.pre('save', async function(){
    if(!this.isModified('password')){
        return;
    }

    const salt= await bcrypt.genSalt(10);
    this.password= await bcrypt.hash(this.password, salt);
});

// Instance method to compare entered password with hashed password
userSchema.methods.matchPassword= async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports= mongoose.model('User', userSchema);