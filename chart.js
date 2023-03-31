async function drawChart() {
  // access data
  const dataset = await d3.tsv("world_cup_geo.tsv")
  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")

  const attendanceAccessor = d => +d.attendance

  // create chart dimensions
  const width = 1050
  let dimensions = {
    width: width,
    height: width * 0.52,
    margin: {
      top: 20,
      right: 20,
      bottom: 50,
      left: 50
    }
  }

  dimensions.boundedWidth = dimensions.width
    - dimensions.margin.left
    - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height
    - dimensions.margin.top
    - dimensions.margin.bottom

  // draw canvas
  const wrapper = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .on("click", reset)

  let bounds = wrapper.append("g")
    .style("transform", `translate(${
      dimensions.margin.left
    }px, ${
      dimensions.margin.top
    }px)`)

  // create scales
  const attendanceScale = d3.scaleLinear()
    .domain(d3.extent(dataset, attendanceAccessor))
    .range([3, 30])

  // draw data
  const projection = d3.geoMercator()
    .scale(160)
    .translate([dimensions.boundedWidth / 2, dimensions.boundedHeight / 2])
  const path = d3.geoPath()
    .projection(projection)
  const map = bounds.append("g")

  const countries = map.selectAll("path")
    .data(topojson.feature(world, world.objects.countries).features)
    .enter().append("path")
      .attr("class", "country")
      .on("click", clicked)
      .attr("d", path)

  const circles = bounds.selectAll("circle")
    .data(dataset)
    .enter().append("circle")
      .attr("cx", d => projection([d.long, d.lat])[0])
      .attr("cy", d => projection([d.long, d.lat])[1])
      .on("mouseenter", function(e, datum) {
        onMouseEnter(datum)
      })
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave)
      .attr("class", "dot")
      .attr("r", d => attendanceScale(attendanceAccessor(d)))

  // set up interactions
  const tooltip = d3.select("#tooltip")
    .attr("class", "tooltip")

  function onMouseEnter(d) {
    tooltip.select("#teams")
      .text(`${d.team1} vs ${d.team2} (${d.goals})`)
    tooltip.select("#attendance")
      .text(`Attendance: ${attendanceAccessor(d).toLocaleString()}`)
    tooltip.select("#year")
      .text(`Year: ${d.year}`)
    tooltip.select("#stadium")
      .text(`Stadium: ${d.stadium}`)
    tooltip.style("opacity", 0.9)
  }

  function onMouseMove() {
    tooltip.style("left", `${event.pageX + 20}px`)
    tooltip.style("top", `${event.pageY}px`)
  }

  function onMouseLeave() {
    tooltip.style("opacity", 0)
  }

  function clicked(event, d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d)
    event.stopPropagation()
    countries.transition().style("fill", null)
    d3.select(this).transition().style("fill", "#5C95FF")
    wrapper.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(dimensions.boundedWidth / 2, dimensions.boundedHeight / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / dimensions.boundedWidth, (y1 - y0) / dimensions.boundedHeight)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.pointer(event, wrapper.node())
    )
  }

  function reset() {
    countries.transition().style("fill", null)
    wrapper.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(wrapper.node()).invert([dimensions.boundedWidth / 2, dimensions.boundedHeight / 2])
    )
  }

  // zoom
  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed)

  function zoomed(event) {
    const {transform} = event
    map.attr("transform", transform)
    circles.attr("transform", transform)
  }

  wrapper.call(zoom)
}

drawChart()
