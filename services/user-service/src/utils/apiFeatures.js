class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString } // destructuring the object, it is hard copy of the object instead of reference (const queryObj = req.query)
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el])

        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) // replace gte, gt, lte, lt with $gte, $gt, $lte, $lt

        this.query = this.query.find(JSON.parse(queryStr))
        // let query = Tour.find(JSON.parse(queryStr))
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // console.log(this.queryString.sort)
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy) // now we can chain
        }
        else {
            this.query = this.query.sort('-createdAt _id')
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v') // exclude __v field
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 100
        const skip = (page - 1) * limit
        // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
        // query = query.skip(10).limit(10) // skip 10 documents and limit to 10 documents

        this.query = this.query.skip(skip).limit(limit) // chaining

        return this;
    }
}

module.exports = APIFeatures;