
const mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
  user_db_id: String,
  imageLink: String,
	img:
	{
		data: Buffer,
		contentType: String
	}
});

//Image is a model which has a schema imageSchema
const PetPic = mongoose.model("PetPics", imageSchema);

module.exports = PetPic;
