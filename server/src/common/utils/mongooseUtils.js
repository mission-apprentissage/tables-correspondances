module.exports = {
  getNbModifiedDocuments: (result) => (result.nModified !== undefined ? result.nModified : result.n),
  paginate: async (Model, query, options = {}) => {
    let total = await Model.count(query);
    let page = options.page || 1;
    let limit = options.limit || 10;
    let skip = (page - 1) * limit;

    return {
      find: Model.find(query, options.projection || {})
        .sort(options.sort || {})
        .skip(skip)
        .limit(limit)
        .lean(),
      pagination: {
        page,
        resultats_par_page: limit,
        nombre_de_page: Math.ceil(total / limit) || 1,
        total,
      },
    };
  },
  paginateAggregation: async (Model, pipeline, options = {}) => {
    let page = options.page || 1;
    let limit = options.limit || 10;
    let skip = (page - 1) * limit;

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        pagination: [
          { $count: "total" },
          {
            $addFields: {
              page,
              resultats_par_page: limit,
              nombre_de_page: { $ceil: { $divide: ["$total", limit] } },
            },
          },
        ],
      },
    });

    let res = await Model.aggregate(pipeline);

    return {
      data: res[0].data,
      pagination: res[0].pagination[0] || {
        nombre_de_page: 1,
        page: 1,
        resultats_par_page: 10,
        total: 0,
      },
    };
  },
  paginateAggregationWithCursor: async (Model, pipeline, options = {}) => {
    let page = options.page || 1;
    let limit = options.limit || 10;
    let skip = (page - 1) * limit;

    // FIXME Check if it is possible to use $facet with cursor
    let results = await Promise.all([
      Model.aggregate([...pipeline, { $skip: skip }, { $limit: limit }])
        .cursor()
        .exec(),
      Model.aggregate([
        ...pipeline,
        { $count: "total" },
        {
          $addFields: {
            page,
            resultats_par_page: limit,
            nombre_de_page: { $ceil: { $divide: ["$total", limit] } },
          },
        },
      ]),
    ]);

    return {
      cursor: results[0],
      pagination: results[1][0] || {
        nombre_de_page: 1,
        page: 1,
        resultats_par_page: 10,
        total: 0,
      },
    };
  },
};
