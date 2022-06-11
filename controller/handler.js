const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');

//query select features
class QueryFeature {
  constructor(query, options) {
    this.query = query;
    this.options = options;
  }

  filter() {
    const optionsObj = { ...this.options };
    const exclude = ['sort', 'page', 'limit', 'fields'];
    exclude.forEach((item) => delete optionsObj[item]);

    this.query.find(optionsObj);
    return this;
  }

  sort() {
    if (this.options.sort) {
      const sort = this.options.sort.split(',').join(' ');
      this.query = this.query.sort(sort);
    } else {
      this.query = this.query.sort('createdAt');
    }
    return this;
  }

  pagination() {
    if (this.options.page && this.options.limit) {
      const limit = parseInt(this.options.limit, 10);
      const skip = this.options.page * limit;
      //const select = req.query.fields.split(',').join(' ');
      this.query = this.query.skip(skip).limit(limit);
    } else {
      //-fieldName will exclude the given fields
      this.query = this.query.skip(0).limit(100);
    }
    return this;
  }

  limitingField() {
    if (this.options.fields) {
      const select = this.options.fields.split(',').join(' ');
      this.query = this.query.select(select);
    } else {
      //-fieldName will exclude the given fields
      this.query = this.query.select('-__v -createdAt');
    }
    return this;
  }
}

exports.deleteOne = (Model, modelName) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    // if (!doc)
    //   next(new AppError('No such as document was found to delete'), 404);

    res.status(201).json({
      status: 'success',
      message: `The ${modelName} has been deleted successfully`,
      //data: doc,
    });
  });

exports.createDocument = (Model, modelName) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: `The ${modelName} has been created successfully`,
      data: doc,
    });
  });

exports.getAllDocuments = (Model, modelName, populateValue, selectValue) =>
  catchAsync(async (req, res) => {
    const findObj = { ...req.query };
    let queryString = JSON.stringify(findObj);
    //  regex refreance at  https://www.w3schools.com/jsref/jsref_obj_regexp.asp
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    const realQuery = JSON.parse(queryString);
    const features = new QueryFeature(
      Model.find(req.body).populate(populateValue).select(selectValue),
      realQuery
    )
      .filter()
      //.sort()
      .pagination()
      .limitingField();
    const document = await features.query;
    //const document = await features.query.explain();

    res.status(200).json({
      status: 'ok',
      message: `Here are the list of available ${modelName}`,
      result: document.length,
      data: document,
    });
  });

exports.getDocumentById = (Model, modelName, populateValue) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id).populate(populateValue);

    if (!doc) return next(new AppError(`No ${modelName} with given id`, 404));

    res.status(200).json({
      status: 'ok',
      message: `here is the requested ${modelName}`,
      data: doc,
    });
  });

exports.updateDocument = (Model, modelName) =>
  catchAsync(async (req, res, next) => {
    //const newId = tours[tours.length - 1].id + 1;
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      //false to disable validation
      runValidators: true,
    });

    if (!doc)
      return next(
        new AppError(`No ${modelName} found to update with given id`, 404)
      );

    res.status(201).json({
      status: 'success',
      message: `Updated ${modelName} successfully`,
      data: doc,
    });
  });
